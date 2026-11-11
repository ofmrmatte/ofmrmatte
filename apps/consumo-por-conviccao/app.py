import argparse
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import uuid
from contextlib import contextmanager, asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from unicodedata import normalize

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

ROOT = Path(__file__).resolve().parent
DB = Path(os.getenv("DATABASE_PATH", str(ROOT / "data" / "site.sqlite")))
SECRET = os.getenv("SECRET_KEY", "")
if not SECRET:
    if os.getenv("APP_ENV") == "production":
        raise RuntimeError("Defina SECRET_KEY no ambiente antes de iniciar produção")
    SECRET = "somente-desenvolvimento-nao-usar-em-producao"
TOKEN = URLSafeTimedSerializer(SECRET, salt="admin-session")
IS_SECURE = os.getenv("APP_ENV") == "production"
UF = {"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"}
CATEGORIES = ["Alimentação e restaurantes", "Bares e cafés", "Supermercados", "Moda e vestuário", "Saúde e farmácias", "Beleza e estética", "Educação", "Tecnologia", "Cultura e entretenimento", "Serviços", "Varejo", "Outros"]
SHORTENERS = {"bit.ly", "t.co", "tinyurl.com", "goo.gl", "cutt.ly", "lnkd.in", "ow.ly"}
@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield

app = FastAPI(title="Consumo por Convicção", docs_url=None, redoc_url=None, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")
templates = Jinja2Templates(directory=str(ROOT / "templates"))


def init_db():
    DB.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB) as conn:
        conn.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
        conn.execute("PRAGMA journal_mode=WAL")


@contextmanager
def conn():
    db = sqlite3.connect(DB, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def hashed_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    return salt.hex() + ":" + hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000).hex()


def check_password(password, stored):
    try:
        salt, expected = stored.split(":")
        return hmac.compare_digest(hashed_password(password, bytes.fromhex(salt)).split(":")[1], expected)
    except (ValueError, AttributeError):
        return False


def current_admin(request):
    token = request.cookies.get("admin_session")
    if not token:
        return None
    try:
        admin_id = TOKEN.loads(token, max_age=8 * 3600)
    except (BadSignature, SignatureExpired):
        return None
    with conn() as db:
        return db.execute("SELECT id,email FROM admins WHERE id=?", (admin_id,)).fetchone()


def check_csrf(request, csrf):
    cookie = request.cookies.get("csrf", "")
    if not cookie or not hmac.compare_digest(cookie, csrf):
        raise HTTPException(status_code=403, detail="Sessão de formulário expirada. Atualize a página.")


def view(request, name, data=None, status=200):
    context = {"request": request, "categories": CATEGORIES, "ufs": sorted(UF), "admin": current_admin(request), "year": datetime.now().year}
    context.update(data or {})
    token = request.cookies.get("csrf") or secrets.token_urlsafe(30)
    context["csrf"] = token
    response = templates.TemplateResponse(request, name, context, status_code=status)
    if request.cookies.get("csrf") != token:
        response.set_cookie("csrf", token, httponly=True, secure=IS_SECURE, samesite="lax", max_age=86400)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'"
    return response


def slugify(t):
    t = normalize("NFKD", t).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:100]


def safe_link(url, required=False):
    url = (url or "").strip()
    if not url and not required:
        return ""
    if not (8 <= len(url) <= 450):
        raise ValueError("Link inválido: informe endereço HTTPS completo.")
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if (parsed.scheme != "https" or parsed.username or parsed.password or parsed.port or not host or
        "." not in host or host.endswith((".local", ".internal")) or host == "localhost" or
        re.match(r"^\d+(?:\.\d+){3}$", host) or host in SHORTENERS):
        raise ValueError("A fonte precisa ser um endereço HTTPS institucional válido, sem encurtadores.")
    return url


def validate_submission(name, city, uf, category, website, source_url, summary, statement_date):
    name, city, summary, uf = name.strip(), city.strip(), summary.strip(), uf.upper().strip()
    if not (3 <= len(name) <= 150 and 2 <= len(city) <= 90 and uf in UF and category in CATEGORIES):
        raise ValueError("Confira nome, cidade, UF e categoria.")
    if not (30 <= len(summary) <= 1600):
        raise ValueError("Descreva a declaração pública em 30 a 1.600 caracteres.")
    if re.search(r"\b\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2}\b|\b\d{5}-?\d{3}\b|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", summary):
        raise ValueError("Remova CPF, CEP e endereços de e-mail do resumo.")
    if re.search(r"(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[- ]?\d{4}", summary):
        raise ValueError("Não inclua telefones particulares.")
    if re.search(r"\b(?:rua|avenida|travessa)\s+[^,]{3,35},?\s*\d{1,5}\b", summary, re.I):
        raise ValueError("Não inclua endereço residencial.")
    website, source_url = safe_link(website), safe_link(source_url, required=True)
    if statement_date:
        try:
            date = datetime.strptime(statement_date, "%Y-%m-%d").date()
            if date > datetime.now(timezone.utc).date():
                raise ValueError
        except ValueError:
            raise ValueError("Data da declaração inválida.")
    return name, city, uf, category, website, source_url, summary


def ip_hash(request):
    remote = request.client.host if request.client else "unknown"
    return hmac.new(SECRET.encode(), remote.encode(), hashlib.sha256).hexdigest()


def protocol(prefix):
    return f"{prefix}-{secrets.token_hex(5).upper()}"


def admin_required(request):
    admin = current_admin(request)
    if not admin:
        raise HTTPException(status_code=403, detail="Acesso somente a administradores.")
    return admin


def audit(db, admin_id, action, target_id, notes=""):
    db.execute("INSERT INTO moderation_log (admin_id, action, target_id, notes) VALUES (?,?,?,?)", (admin_id, action, target_id, notes[:700]))


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    with conn() as db:
        stats = {
            "published": db.execute("SELECT COUNT(*) FROM establishments WHERE status='published'").fetchone()[0],
            "cities": db.execute("SELECT COUNT(*) FROM (SELECT DISTINCT city,uf FROM establishments WHERE status='published')").fetchone()[0],
            "pending": db.execute("SELECT COUNT(*) FROM submissions WHERE status='pending'").fetchone()[0],
        }
    return view(request, "home.html", {"stats": stats})


@app.get("/estabelecimentos", response_class=HTMLResponse)
def directory(request: Request, q: str = "", uf: str = "", cidade: str = "", categoria: str = "", pagina: int = 1, progressistas: int = 0):
    q, uf, cidade, categoria = q[:80].strip(), uf[:2].upper(), cidade[:80].strip(), categoria[:60].strip()
    pagina = max(1, min(pagina, 10000))
    clauses, args = ["status='published'"], []
    if q: clauses.append("name LIKE ?"); args.append(f"%{q}%")
    if uf in UF: clauses.append("uf=?"); args.append(uf)
    if cidade: clauses.append("city LIKE ?"); args.append(f"%{cidade}%")
    if categoria in CATEGORIES: clauses.append("category=?"); args.append(categoria)
    if progressistas: clauses.append("progressive_tag=1")
    where = " AND ".join(clauses)
    with conn() as db:
        total = db.execute(f"SELECT COUNT(*) FROM establishments WHERE {where}", args).fetchone()[0]
        rows = db.execute(f"SELECT * FROM establishments WHERE {where} ORDER BY verified_at DESC, created_at DESC LIMIT 12 OFFSET ?", (*args, (pagina-1)*12)).fetchall()
    return view(request, "directory.html", {"rows": rows, "total": total, "q": q, "uf": uf, "cidade": cidade, "categoria": categoria, "pagina": pagina, "pages": (total+11)//12, "progressistas": progressistas})


@app.get("/estabelecimentos/{slug}", response_class=HTMLResponse)
def detail(request: Request, slug: str):
    with conn() as db:
        row = db.execute("SELECT * FROM establishments WHERE slug=? AND status='published'", (slug,)).fetchone()
    if not row:
        raise HTTPException(404, "Estabelecimento não encontrado")
    return view(request, "detail.html", {"e": row})


@app.get("/enviar", response_class=HTMLResponse)
def submit_page(request: Request):
    return view(request, "submit.html")


@app.post("/enviar", response_class=HTMLResponse)
def submit(request: Request, name: str = Form(""), city: str = Form(""), uf: str = Form(""), category: str = Form(""), website: str = Form(""), source_url: str = Form(""), summary: str = Form(""), statement_date: str = Form(""), privacy: str = Form(""), honeypot: str = Form(""), csrf: str = Form("")):
    check_csrf(request, csrf)
    if honeypot:
        return view(request, "success.html", {"protocol": protocol("ENV")})
    try:
        if privacy != "sim":
            raise ValueError("Confirme que o relato não inclui informações privadas.")
        name, city, uf, category, website, source_url, summary = validate_submission(name, city, uf, category, website, source_url, summary, statement_date)
        phash = ip_hash(request)
        with conn() as db:
            count = db.execute("SELECT COUNT(*) FROM submissions WHERE ip_hash=? AND created_at > datetime('now','-1 hour')", (phash,)).fetchone()[0]
            if count >= 5:
                raise ValueError("Limite temporário de envios atingido. Tente novamente mais tarde.")
            existing = db.execute("SELECT 1 FROM submissions WHERE status='pending' AND (source_url=? OR (lower(name)=lower(?) AND lower(city)=lower(?) AND uf=?))", (source_url, name, city, uf)).fetchone()
            existing2 = db.execute("SELECT 1 FROM establishments WHERE status='published' AND lower(name)=lower(?) AND lower(city)=lower(?) AND uf=?", (name, city, uf)).fetchone()
            if existing or existing2:
                raise ValueError("Já existe um registro ou envio aguardando análise para este estabelecimento/fonte.")
            code = protocol("ENV")
            db.execute("INSERT INTO submissions (id,protocol,name,city,uf,category,website,source_url,statement_date,summary,ip_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)", (str(uuid.uuid4()), code, name, city, uf, category, website, source_url, statement_date or None, summary, phash))
        return view(request, "success.html", {"protocol": code})
    except (ValueError, sqlite3.IntegrityError) as exc:
        return view(request, "submit.html", {"error": str(exc)}, status=400)


@app.get("/contestar", response_class=HTMLResponse)
def appeal_page(request: Request, registro: str = ""):
    with conn() as db:
        rows = db.execute("SELECT id,name,city,uf FROM establishments WHERE status='published' ORDER BY name LIMIT 1000").fetchall()
    return view(request, "appeal.html", {"rows": rows, "registro": registro})


@app.post("/contestar", response_class=HTMLResponse)
def appeal(request: Request, establishment_id: str = Form(""), request_type: str = Form("revisao"), relation: str = Form("outro"), justification: str = Form(""), evidence_url: str = Form(""), contact_email: str = Form(""), honeypot: str = Form(""), csrf: str = Form("")):
    check_csrf(request, csrf)
    if honeypot:
        return view(request, "success.html", {"protocol": protocol("REV")})
    try:
        if request_type not in {"revisao", "correcao", "remocao"} or relation not in {"representante", "cliente", "outro"}:
            raise ValueError("Selecione um tipo de solicitação válido.")
        if not 20 <= len(justification.strip()) <= 2000:
            raise ValueError("A justificativa deve ter entre 20 e 2.000 caracteres.")
        evidence_url = safe_link(evidence_url)
        if contact_email and (len(contact_email) > 150 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", contact_email)):
            raise ValueError("E-mail de contato inválido.")
        phash = ip_hash(request)
        with conn() as db:
            if establishment_id and not db.execute("SELECT 1 FROM establishments WHERE id=? AND status='published'", (establishment_id,)).fetchone():
                raise ValueError("Registro selecionado não encontrado.")
            if db.execute("SELECT COUNT(*) FROM appeals WHERE ip_hash=? AND created_at > datetime('now','-1 hour')", (phash,)).fetchone()[0] >= 5:
                raise ValueError("Limite de solicitações atingido temporariamente.")
            code = protocol("REV")
            db.execute("INSERT INTO appeals (id,protocol,establishment_id,request_type,relation,justification,evidence_url,contact_email,ip_hash) VALUES (?,?,?,?,?,?,?,?,?)", (str(uuid.uuid4()), code, establishment_id or None, request_type, relation, justification.strip(), evidence_url, contact_email, phash))
        return view(request, "success.html", {"protocol": code})
    except ValueError as exc:
        with conn() as db:
            rows = db.execute("SELECT id,name,city,uf FROM establishments WHERE status='published' ORDER BY name LIMIT 1000").fetchall()
        return view(request, "appeal.html", {"rows": rows, "error": str(exc), "registro": establishment_id}, status=400)


@app.get("/criterios", response_class=HTMLResponse)
def criteria(request: Request):
    return view(request, "criteria.html")


@app.get("/privacidade", response_class=HTMLResponse)
def privacy(request: Request):
    return view(request, "privacy.html")


@app.get("/admin/login", response_class=HTMLResponse)
def login_page(request: Request):
    return view(request, "login.html")


@app.post("/admin/login")
def login(request: Request, email: str = Form(""), password: str = Form(""), csrf: str = Form("")):
    check_csrf(request, csrf)
    phash = ip_hash(request)
    with conn() as db:
        count = db.execute("SELECT COUNT(*) FROM login_attempts WHERE ip_hash=? AND created_at>datetime('now','-15 minutes')", (phash,)).fetchone()[0]
        if count >= 10:
            return view(request, "login.html", {"error": "Muitas tentativas. Tente mais tarde."}, status=429)
        admin = db.execute("SELECT * FROM admins WHERE email=?", (email.lower().strip(),)).fetchone()
        if not admin or not check_password(password, admin["password_hash"]):
            db.execute("INSERT INTO login_attempts(ip_hash) VALUES(?)", (phash,))
            return view(request, "login.html", {"error": "Credenciais inválidas."}, status=401)
        db.execute("DELETE FROM login_attempts WHERE ip_hash=?", (phash,))
    response = RedirectResponse("/admin", status_code=303)
    response.set_cookie("admin_session", TOKEN.dumps(admin["id"]), httponly=True, secure=IS_SECURE, samesite="lax", max_age=8*3600)
    return response


@app.post("/admin/sair")
def logout(request: Request, csrf: str = Form("")):
    check_csrf(request, csrf)
    response = RedirectResponse("/", status_code=303)
    response.delete_cookie("admin_session")
    return response


@app.get("/admin", response_class=HTMLResponse)
def dashboard(request: Request):
    admin = current_admin(request)
    if not admin:
        return RedirectResponse("/admin/login", status_code=303)
    with conn() as db:
        submissions = db.execute("SELECT * FROM submissions ORDER BY CASE WHEN status='pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 100").fetchall()
        appeals = db.execute("SELECT a.*, e.name AS establishment_name FROM appeals a LEFT JOIN establishments e ON e.id=a.establishment_id ORDER BY CASE WHEN a.status='pending' THEN 0 ELSE 1 END, a.created_at DESC LIMIT 100").fetchall()
        establishments = db.execute("SELECT * FROM establishments ORDER BY created_at DESC LIMIT 100").fetchall()
        logs = db.execute("SELECT l.*,a.email FROM moderation_log l JOIN admins a ON a.id=l.admin_id ORDER BY l.created_at DESC LIMIT 30").fetchall()
    return view(request, "admin.html", {"submissions": submissions, "appeals": appeals, "establishments": establishments, "logs": logs})


@app.post("/admin/submission/{submission_id}")
def moderate_submission(request: Request, submission_id: str, action: str = Form(""), statement_title: str = Form(""), progressive_tag: str = Form(""), notes: str = Form(""), csrf: str = Form("")):
    admin = admin_required(request)
    check_csrf(request, csrf)
    if action not in {"approve", "reject"}:
        raise HTTPException(400, "Ação inválida")
    with conn() as db:
        item = db.execute("SELECT * FROM submissions WHERE id=? AND status='pending'", (submission_id,)).fetchone()
        if not item:
            raise HTTPException(404, "Envio não encontrado ou já analisado")
        eid = None
        if action == "approve":
            if not (5 <= len(statement_title.strip()) <= 180):
                raise HTTPException(400, "Informe um título factual entre 5 e 180 caracteres")
            eid = str(uuid.uuid4())
            slug = slugify(item["name"]+"-"+item["city"]+"-"+item["uf"]) + "-" + eid[:8]
            db.execute("INSERT INTO establishments (id,slug,name,city,uf,category,website,source_url,statement_date,statement_title,statement_summary,progressive_tag,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (eid, slug, item["name"], item["city"], item["uf"], item["category"], item["website"], item["source_url"], item["statement_date"], statement_title.strip(), item["summary"], 1 if progressive_tag == "sim" else 0, "published"))
        db.execute("UPDATE submissions SET status=?,review_notes=?,establishment_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?", ("approved" if action=="approve" else "rejected", notes[:700], eid, submission_id))
        audit(db, admin["id"], action, submission_id, notes)
    return RedirectResponse("/admin#submissions", status_code=303)


@app.post("/admin/appeal/{appeal_id}")
def moderate_appeal(request: Request, appeal_id: str, action: str = Form(""), notes: str = Form(""), archive: str = Form(""), csrf: str = Form("")):
    admin = admin_required(request)
    check_csrf(request, csrf)
    if action not in {"accept", "reject"}:
        raise HTTPException(400, "Ação inválida")
    with conn() as db:
        row = db.execute("SELECT * FROM appeals WHERE id=? AND status='pending'", (appeal_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Contestação não encontrada")
        if archive == "sim" and action == "accept" and row["establishment_id"]:
            db.execute("UPDATE establishments SET status='archived' WHERE id=?", (row["establishment_id"],))
        db.execute("UPDATE appeals SET status=?,notes=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?", ("accepted" if action=="accept" else "rejected", notes[:700], appeal_id))
        audit(db, admin["id"], "appeal_"+action, appeal_id, notes)
    return RedirectResponse("/admin#appeals", status_code=303)


@app.post("/admin/establishment/{eid}")
def moderate_establishment(request: Request, eid: str, action: str = Form(""), summary: str = Form(""), title: str = Form(""), notes: str = Form(""), csrf: str = Form("")):
    admin = admin_required(request)
    check_csrf(request, csrf)
    if action not in {"archive", "restore", "edit"}:
        raise HTTPException(400, "Ação inválida")
    with conn() as db:
        if not db.execute("SELECT 1 FROM establishments WHERE id=?", (eid,)).fetchone():
            raise HTTPException(404, "Registro não encontrado")
        if action == "edit":
            if not (5 <= len(title.strip()) <= 180 and 20 <= len(summary.strip()) <= 2000):
                raise HTTPException(400, "Título ou resumo inválidos")
            db.execute("UPDATE establishments SET statement_title=?, statement_summary=?, verified_at=CURRENT_TIMESTAMP WHERE id=?", (title.strip(), summary.strip(), eid))
        else:
            db.execute("UPDATE establishments SET status=?,verified_at=CURRENT_TIMESTAMP WHERE id=?", ("archived" if action=="archive" else "published", eid))
        audit(db, admin["id"], "establishment_"+action, eid, notes)
    return RedirectResponse("/admin#records", status_code=303)


def create_admin(email, password):
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(password) < 12:
        raise ValueError("E-mail válido e senha de pelo menos 12 caracteres obrigatórios")
    init_db()
    with conn() as db:
        db.execute("INSERT OR REPLACE INTO admins (id,email,password_hash) VALUES ((SELECT id FROM admins WHERE email=?),?,?)", (email, email.lower(), hashed_password(password)))


if __name__ == "__main__":
    import getpass
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["init-db", "create-admin"])
    parser.add_argument("email", nargs="?")
    args = parser.parse_args()
    if args.command == "init-db":
        init_db()
        print("Banco inicializado:", DB)
    else:
        if not args.email:
            parser.error("Informe o e-mail do administrador")
        create_admin(args.email, getpass.getpass("Senha forte (mínimo 12 caracteres): "))
        print("Administrador criado.")
