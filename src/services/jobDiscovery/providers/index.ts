import { RemotiveProvider } from './remotive';
import { RemoteOKProvider } from './remoteok';
import { HimalayasProvider } from './himalayas';
import { ArbeitNowProvider } from './arbeitNow';
import { WeWorkRemotelyProvider } from './weWorkRemotely';
import { GreenhouseProvider } from './greenhouse';
import { LeverProvider } from './lever';
import { InternshalaProvider } from './internshala';
import { NaukriProvider } from './naukri';
import { JobProvider } from '../types';

export const providers: JobProvider[] = [
  // Public JSON APIs — fast, reliable, keyword-searchable
  new RemotiveProvider(),
  new HimalayasProvider(),
  new ArbeitNowProvider(),

  // Public RSS/tag feeds
  new RemoteOKProvider(),
  new WeWorkRemotelyProvider(),

  // ATS public boards — company-specific, rich role data
  new GreenhouseProvider(),
  new LeverProvider(),

  // Native Playwright scraper providers
  new InternshalaProvider(),
  new NaukriProvider(),
];
