export interface LetterSignatory {
  id: string;
  title: string; // e.g. "President", "General Secretary", "Convener"
  name: string;
  unit: string;
  signatureDataUrl?: string;
  showSignature: boolean;
}

export interface OfficialLetter {
  id: string;
  referenceNumber: string; // e.g. "KCA/FUJ/REF/2026/001"
  seriesNumber: number;
  date: string; // YYYY-MM-DD
  unit: string; // "Central", "Fujairah", "Kalba", "Khorfakhan", "Dibba"
  toAddress: string;
  subject: string;
  salutation: string; // "Respected Sir / Madam,"
  bodyHtml: string; // Formatted content
  signatories: LetterSignatory[];
  status: 'Draft' | 'Issued' | 'Signed' | 'Archived';
  category: 'General' | 'NOC' | 'Embassy / Consulate' | 'Sponsorship' | 'Notice' | 'Appointment';
  createdAt: string;
  updatedAt: string;
  issuedAt?: string;
  createdByName?: string;
}

export interface LetterSeriesConfig {
  unit: string;
  prefix: string; // e.g. "KCA"
  unitCode: string; // e.g. "FUJ", "CENTRAL", "KLB", "KHK", "DBA"
  currentYear: number;
  nextSeriesNumber: number;
}

export interface LetterTemplate {
  id: string;
  title: string;
  category: OfficialLetter['category'];
  subject: string;
  toAddress: string;
  salutation: string;
  bodyHtml: string;
}

export const DEFAULT_LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl_general_noc',
    title: 'No Objection Certificate (NOC)',
    category: 'NOC',
    subject: 'NO OBJECTION CERTIFICATE - PARTICIPATION IN CULTURAL FESTIVAL',
    toAddress: 'To Whom It May Concern,\nRelevant Authorities,\nUnited Arab Emirates.',
    salutation: 'Respected Sir / Madam,',
    bodyHtml: `<p>This is to certify that <strong>[MEMBER FULL NAME]</strong> (KCA Membership ID: <strong>[MEMBERSHIP_ID]</strong>) is a bonafide registered member in good standing of <strong>Kairali Cultural Association Fujairah</strong> under the <strong>[UNIT_NAME] Unit</strong>.</p>
<p>The Association has no objection to the above member representing our organization and participating in community, cultural, and welfare activities in the UAE.</p>
<p>This certificate is issued upon the member's request for official submission purposes and is valid for the current administrative year.</p>`,
  },
  {
    id: 'tpl_embassy_repatriation',
    title: 'Consular Welfare & Repatriation Assistance',
    category: 'Embassy / Consulate',
    subject: 'REQUEST FOR CONSULAR ASSISTANCE / EMERGENCY ATTESTATION',
    toAddress: 'The Consul (Community Affairs),\nConsulate General of India,\nAl Hamriya, Diplomatic Enclave, Dubai, UAE.',
    salutation: 'Respected Consul General,',
    bodyHtml: `<p>We are writing on behalf of the <strong>Kairali Cultural Association Fujairah (A Norka affiliated Organisation)</strong> to kindly solicit your esteemed office's assistance regarding the consular support and emergency documentation for <strong>[APPLICANT NAME]</strong>, Indian National (Passport No: <strong>[PASSPORT_NO]</strong>).</p>
<p>The applicant is currently undergoing humanitarian challenges in Fujairah, and our Association's NORKA Welfare Cell is actively coordinating local community aid and relief measures.</p>
<p>We humbly request your urgent intervention and expeditious consular clearance. Thank you for your continued dedication to the non-resident Indian community.</p>`,
  },
  {
    id: 'tpl_sponsorship_appeal',
    title: 'Sponsorship & Partnership Proposal',
    category: 'Sponsorship',
    subject: 'OFFICIAL INVITATION: TITLE SPONSORSHIP FOR ANNUAL KERALA KALOLSAVAM 2026',
    toAddress: 'The Managing Director / Marketing Head,\n[ORGANIZATION / COMPANY NAME],\nFujairah, United Arab Emirates.',
    salutation: 'Dear Esteemed Partner,',
    bodyHtml: `<p>Warm greetings from <strong>Kairali Cultural Association Fujairah</strong>, representing thousands of expatriate Malayali families across Fujairah and the East Coast of the UAE.</p>
<p>We take great pride in announcing our flagship annual cultural celebration, <strong>Kerala Kalolsavam 2026</strong>, featuring vibrant classical dance, musical concerts, youth literary competitions, and traditional folk art performances.</p>
<p>We cordially invite your esteemed brand to partner with us as a <strong>Title Sponsor</strong>. Your sponsorship will receive extensive brand visibility across event hoardings, media broadcasts, souvenir publications, and digital outreach.</p>
<p>We look forward to an auspicious collaboration and look forward to discussing the partnership tier at your earliest convenience.</p>`,
  },
  {
    id: 'tpl_appointment_letter',
    title: 'Subcommittee Official Appointment Letter',
    category: 'Appointment',
    subject: 'OFFICIAL APPOINTMENT TO SUBCOMMITTEE EXECUTIVE WING',
    toAddress: 'To,\n[MEMBER FULL NAME],\nMembership ID: [MEMBERSHIP_ID],\n[UNIT_NAME] Unit, KCA Fujairah.',
    salutation: 'Dear Colleague,',
    bodyHtml: `<p>We are pleased to formally notify you that the Central Executive Committee of <strong>Kairali Cultural Association Fujairah</strong> has appointed you as the <strong>[DESIGNATION]</strong> of the <strong>[SUBCOMMITTEE_NAME]</strong> for the tenure <strong>2026–2027</strong>.</p>
<p>We have utmost confidence in your organizational leadership, dedication to community welfare, and commitment to the cultural heritage of Kerala in the UAE.</p>
<p>We wish you immense success in fulfilling your organizational responsibilities and elevating the Association to greater heights.</p>`,
  },
];
