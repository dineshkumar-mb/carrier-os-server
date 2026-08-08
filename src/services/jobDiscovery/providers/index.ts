import { RemotiveProvider } from './remotive';
import { RemoteOKProvider } from './remoteok';
import { HimalayasProvider } from './himalayas';
import { ArbeitNowProvider } from './arbeitNow';
import { WeWorkRemotelyProvider } from './weWorkRemotely';
import { GreenhouseProvider } from './greenhouse';
import { LeverProvider } from './lever';
import { InternshalaProvider } from './internshala';
import { NaukriProvider } from './naukri';
import { LinkedInProvider } from './linkedin';
import { ApnaProvider } from './apna';
import { JobProvider } from '../types';

export const providers: JobProvider[] = [
  // Major Indian & Global Professional Portals
  new LinkedInProvider(),
  new NaukriProvider(),
  new ApnaProvider(),
  new InternshalaProvider(),

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
];
