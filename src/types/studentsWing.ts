import { BloodGroup } from './member';

export type StudentWingRole =
  | "Children's Wing Member"
  | "President - Children's Wing"
  | "Secretary - Children's Wing"
  | "Joint Secretary - Children's Wing"
  | "Children's Wing Coordinator"
  | 'Cultural Captain'
  | 'Sports Captain'
  | 'Arts & Literary Lead'
  | 'Volunteer'
  | string;

export const STUDENT_WING_ROLES: StudentWingRole[] = [
  "Children's Wing Member",
  "President - Children's Wing",
  "Secretary - Children's Wing",
  "Joint Secretary - Children's Wing",
  "Children's Wing Coordinator",
  'Cultural Captain',
  'Sports Captain',
  'Arts & Literary Lead',
  'Volunteer',
];

export interface StudentWingMember {
  id: string;
  studentId: string; // Member ID e.g., KCA-CW-FUJ-101
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  photoUrl?: string;

  // Institution & Wing Info
  schoolOrCollege: string;
  gradeOrCourse?: string;
  unit: string;
  wingRole: StudentWingRole;
  talentsOrInterests?: string;
  studentPhone?: string;
  studentEmail?: string;

  // Parent / Guardian Details
  isParentKcaMember: boolean;
  parentMemberId?: string; // Internal ID of KCA member
  parentMembershipId?: string; // Display ID e.g. KCA-FUJ-101
  parentName: string; // Primary Parent / KCA Member Name
  parentRelation: 'Father' | 'Mother' | 'Guardian';
  secondaryParentName?: string; // Spouse / Other Parent Name
  parentPhoneUAE: string;
  parentWhatsapp?: string;
  parentEmail?: string;
  residenceArea?: string;
  keralaDistrict?: string;

  // Membership Status (Complimentary / Free - No Fee)
  joiningDate: string;
  expiryDate: string;
  status: 'Active' | 'Inactive' | 'Alumni';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
