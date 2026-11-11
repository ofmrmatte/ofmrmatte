from starlette.testclient import TestClient
import app as site


def test_pages_and_csrf(tmp_path, monkeypatch):
    monkeypatch.setattr(site, "DB", tmp_path / "site.sqlite")
    with TestClient(site.app) as client:
        assert client.get("/").status_code == 200
        assert client.get("/estabelecimentos").status_code == 200
        assert client.get("/enviar").status_code == 200
        assert client.get("/contestar").status_code == 200
        assert client.get("/criterios").status_code == 200
        assert client.get("/privacidade").status_code == 200
        assert client.post("/enviar", data={"name": "Example"}).status_code == 403


def test_invalid_source_address():
    import pytest
    args = dict(
        name="Empresa Exemplo",
        city="São Paulo",
        uf="SP",
        category="Varejo",
        website="",
        source_url="javascript:alert(1)",
        summary="Comunicado institucional público para teste de validação de entrada.",
        statement_date="",
    )
    with pytest.raises(ValueError):
        site.validate_submission(**args)
    args["source_url"] = "https://bit.ly/abc"
    with pytest.raises(ValueError):
        site.validate_submission(**args)
