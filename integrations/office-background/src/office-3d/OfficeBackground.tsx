'use client';

import { OfficeExperience } from './OfficeExperience';
import type { OfficeExperienceProps } from './types';

export type OfficeBackgroundProps = Omit<OfficeExperienceProps, 'mode'>;
export function OfficeBackground(props: OfficeBackgroundProps) {
  return <OfficeExperience {...props} mode="background" />;
}
