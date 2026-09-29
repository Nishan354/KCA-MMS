import { ContactEntry, ContactPerson } from '../types/contact';

export const STORAGE_KEY_CONTACTS = 'kca_fujairah_contact_bank_v1';

export const INITIAL_CONTACT_BANK: ContactEntry[] = [];

export function loadContacts(): ContactEntry[] {
  if (typeof window === 'undefined') return INITIAL_CONTACT_BANK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading contacts from localStorage:', err);
  }
  return INITIAL_CONTACT_BANK;
}

export function saveContacts(contacts: ContactEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
  } catch (err) {
    console.error('Error saving contacts to localStorage:', err);
  }
}

export function exportContactsCsv(contacts: ContactEntry[], filename = 'KCA_Contact_Bank_Directory.csv'): void {
  const headers = [
    'Organization Name',
    'Malayalam Name',
    'Category',
    'Unit',
    'City',
    'Emirate',
    'General Phone',
    'General Email',
    'Website',
    'Primary Contact Person',
    'Primary Designation',
    'Primary Phone',
    'Primary WhatsApp',
    'Primary Email',
    'Tags',
    'Notes',
  ];

  const rows = contacts.map((c) => {
    const primaryContact: Partial<ContactPerson> = c.contacts.find((p) => p.isPrimary) || c.contacts[0] || {};
    return [
      `"${(c.organizationName || '').replace(/"/g, '""')}"`,
      `"${(c.malayalamName || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.unit || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.emirate || '').replace(/"/g, '""')}"`,
      `"${(c.generalPhone || '').replace(/"/g, '""')}"`,
      `"${(c.generalEmail || '').replace(/"/g, '""')}"`,
      `"${(c.website || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.name || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.designation || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.phone || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(primaryContact.email || '').replace(/"/g, '""')}"`,
      `"${(c.tags || []).join(', ').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportContactsVCard(contact: ContactEntry): void {
  const primary = contact.contacts.find((p) => p.isPrimary) || contact.contacts[0];
  const name = primary ? primary.name : contact.organizationName;
  const org = contact.organizationName;
  const title = primary?.designation || contact.category;
  const tel = primary?.phone || contact.generalPhone || '';
  const email = primary?.email || contact.generalEmail || '';
  const note = `KCA Contact Bank - ${contact.unit} Unit - ${contact.notes || ''}`;

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `ORG:${org}`,
    `TITLE:${title}`,
    tel ? `TEL;TYPE=CELL,VOICE:${tel}` : '',
    email ? `EMAIL;TYPE=WORK,INTERNET:${email}` : '',
    `ADR;TYPE=WORK:;;${contact.address || ''};${contact.city || 'Fujairah'};${contact.emirate || 'UAE'};;United Arab Emirates`,
    contact.website ? `URL:${contact.website}` : '',
    `NOTE:${note}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contact.organizationName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
