// To run this script, use: npm run seed

import { fakerNL as faker } from '@faker-js/faker';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ALL_SKILLS, type Organization, type PriorityDefinition, type StatusDefinition } from '../types';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// --- CONFIGURATION ---
const ORGANIZATION_ID = 'seed-org-12345'; // Use a predictable ID for easy access
const NUM_USERS = 20;
const NUM_TASKS = 200;
const PASSWORD = 'password';

const ORGANIZATION_DATA: Omit<Organization, 'id'> = {
    name: 'Gedemo Bedrijf',
    ownerId: 'owner-user-id', // Will be replaced by the first generated user
    dataResidency: 'US',
    members: {},
    settings: {
        customization: {
            statuses: [
                { name: 'Te Doen', color: '220 13% 69%' },
                { name: 'In Uitvoering', color: '210 89% 64%' },
                { name: 'In Review', color: '262 83% 58%' },
                { name: 'Voltooid', color: '142 71% 45%' },
                { name: 'Geannuleerd', color: '0 84.2% 60.2%' },
            ],
            labels: ['Keuken', 'Woonkamer', 'Badkamer', 'Slaapkamer', 'Algemeen', 'Kantoor', 'Frontend', 'Backend', 'Bug', 'Documentatie'],
             priorities: [
                { name: 'Laag', color: '142.1 76.2% 36.3%', icon: 'ChevronDown' },
                { name: 'Midden', color: '47.9 95.8% 53.1%', icon: 'Equal' },
                { name: 'Hoog', color: '22.8 95.8% 53.1%', icon: 'ChevronUp' },
                { name: 'Urgent', color: '346.8 77.2% 49.8%', icon: 'Flame' },
            ],
        },
        features: {
            gamification: true,
            storyPoints: true,
            timeTracking: true,
        }
    }
};

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Users
    console.log(`👤 Creating ${NUM_USERS} users...`);
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const name = `${firstName} ${lastName}`;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, PASSWORD);
            const skills = faker.helpers.arrayElements(ALL_SKILLS, { min: 2, max: 5 });
            const user = {
                id: userCredential.user.uid,
                email,
                name,
                skills,
                avatar: faker.image.avatar(),
                points: faker.number.int({ min: 0, max: 5000 }),
            };
            users.push(user);
            
            // Set user data in Firestore
            await setDoc(doc(db, 'users', user.id), {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                skills: user.skills,
                points: user.points,
                organizationIds: [ORGANIZATION_ID],
                currentOrganizationId: ORGANIZATION_ID,
            });

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.warn(`Email ${email} already exists, skipping...`);
            } else {
                throw error;
            }
        }
    }
    console.log(`✅ ${users.length} users created.`);


    // 2. Create Organization
    console.log('🏢 Creating organization...');
    const orgRef = doc(db, 'organizations', ORGANIZATION_ID);
    const orgDoc = await getDoc(orgRef);
    if (orgDoc.exists()) {
        console.log('🏢 Organization already exists. Skipping creation.');
    } else {
        const owner = users[0];
        if (!owner) {
            throw new Error("Cannot create organization without an owner user.");
        }
        
        ORGANIZATION_DATA.ownerId = owner.id;
        ORGANIZATION_DATA.members[owner.id] = { role: 'Owner' };
        
        users.slice(1).forEach(user => {
            ORGANIZATION_DATA.members[user.id] = { role: faker.helpers.arrayElement(['Admin', 'Member', 'Member', 'Member']) };
        });

        await setDoc(orgRef, ORGANIZATION_DATA);
        console.log('✅ Organization created.');
    }
    

    // 3. Create Tasks
    console.log(`📝 Creating ${NUM_TASKS} tasks...`);
    const batch = writeBatch(db);
    for (let i = 0; i < NUM_TASKS; i++) {
        const taskRef = doc(collection(db, 'tasks'));
        
        const creator = faker.helpers.arrayElement(users);
        const numAssignees = faker.number.int({ min: 0, max: 3 });
        const assignees = numAssignees > 0 ? faker.helpers.arrayElements(users, numAssignees).map(u => u.id) : [];
        const status = faker.helpers.arrayElement<StatusDefinition>(ORGANIZATION_DATA.settings!.customization.statuses).name;
        const createdAt = faker.date.recent({ days: 90 });
        const completedAt = status === 'Voltooid' ? faker.date.between({ from: createdAt, to: new Date() }) : null;
        
        const task = {
            title: faker.hacker.phrase().replace(/^./, (c) => c.toUpperCase()),
            description: faker.lorem.paragraphs(2),
            organizationId: ORGANIZATION_ID,
            creatorId: creator.id,
            assigneeIds: assignees,
            status,
            priority: faker.helpers.arrayElement<PriorityDefinition>(ORGANIZATION_DATA.settings!.customization.priorities).name,
            labels: faker.helpers.arrayElements(ORGANIZATION_DATA.settings!.customization.labels, { min: 1, max: 3 }),
            createdAt,
            completedAt,
            dueDate: faker.datatype.boolean(0.7) ? faker.date.future({ years: 0.5, refDate: createdAt }) : null,
            storyPoints: faker.datatype.boolean(0.6) ? faker.helpers.arrayElement([1, 2, 3, 5, 8, 13]) : null,
            order: faker.number.int(),
        };

        batch.set(taskRef, task);
    }
    await batch.commit();
    console.log(`✅ ${NUM_TASKS} tasks created.`);


    console.log('🎉 Seeding complete!');

}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
