import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AccountTier } from "../entities/AccountTier";
import { Account } from "../entities/Account";
import { Contact } from "../entities/Contact";
import { Task } from "../entities/Task";
import { Note } from "../entities/Note";
import { HealthScore } from "../entities/HealthScore";
import { AccountActivity } from "../entities/AccountActivity";

const accountTiers = [
  {
    name: "Enterprise",
    description: "Large enterprise customers with premium support",
    slaHours: 2
  },
  {
    name: "Business",
    description: "Medium-sized business customers",
    slaHours: 4
  },
  {
    name: "Starter",
    description: "Small business and startup customers",
    slaHours: 8
  }
];

const sampleAccounts = [
  {
    name: "TechCorp Solutions",
    email: "contact@techcorp.com",
    phone: "+1-555-0101",
    address: "123 Innovation Drive, San Francisco, CA 94105",
    industry: "Technology",
    website: "https://techcorp.com",
    description: "Leading software development company specializing in enterprise solutions",
    businessUseCase: "Enterprise Software Development",
    techStack: "React, Node.js, PostgreSQL, AWS",
    health: 85,
    revenue: 2500000.00,
    renewalDate: new Date("2024-12-15"),
    arr: 2500000.00,
    riskScore: 15,
    lastTouchpoint: new Date("2024-01-15"),
    nextScheduled: new Date("2024-02-01"),
    accountManager: "Sarah Johnson",
    customerSuccessManager: "Mike Chen",
    salesEngineer: "Alex Rodriguez",
    status: "active" as const,
    employees: 150
  },
  {
    name: "Global Retail Inc",
    email: "info@globalretail.com",
    phone: "+1-555-0202",
    address: "456 Commerce Blvd, New York, NY 10001",
    industry: "Retail",
    website: "https://globalretail.com",
    description: "International retail chain with 500+ locations",
    businessUseCase: "E-commerce Platform",
    techStack: "Vue.js, Python, MySQL, Azure",
    health: 72,
    revenue: 1800000.00,
    renewalDate: new Date("2024-08-20"),
    arr: 1800000.00,
    riskScore: 28,
    lastTouchpoint: new Date("2024-01-10"),
    nextScheduled: new Date("2024-01-25"),
    accountManager: "David Wilson",
    customerSuccessManager: "Lisa Park",
    salesEngineer: "Tom Anderson",
    status: "at-risk" as const,
    employees: 2500
  },
  {
    name: "HealthTech Innovations",
    email: "hello@healthtech.com",
    phone: "+1-555-0303",
    address: "789 Medical Center Way, Boston, MA 02108",
    industry: "Healthcare",
    website: "https://healthtech.com",
    description: "Healthcare technology startup focused on patient care",
    businessUseCase: "Healthcare Management System",
    techStack: "Angular, Java, MongoDB, GCP",
    health: 95,
    revenue: 800000.00,
    renewalDate: new Date("2024-06-10"),
    arr: 800000.00,
    riskScore: 8,
    lastTouchpoint: new Date("2024-01-20"),
    nextScheduled: new Date("2024-02-05"),
    accountManager: "Emily Davis",
    customerSuccessManager: "Chris Thompson",
    salesEngineer: "Rachel Green",
    status: "active" as const,
    employees: 75
  },
  {
    name: "FinanceFirst Bank",
    email: "support@financefirst.com",
    phone: "+1-555-0404",
    address: "321 Wall Street, New York, NY 10005",
    industry: "Finance",
    website: "https://financefirst.com",
    description: "Regional bank with focus on digital banking solutions",
    businessUseCase: "Digital Banking Platform",
    techStack: "React, .NET, SQL Server, AWS",
    health: 60,
    revenue: 3200000.00,
    renewalDate: new Date("2024-09-30"),
    arr: 3200000.00,
    riskScore: 35,
    lastTouchpoint: new Date("2024-01-05"),
    nextScheduled: new Date("2024-01-30"),
    accountManager: "Robert Brown",
    customerSuccessManager: "Jennifer Lee",
    salesEngineer: "Kevin Martinez",
    status: "at-risk" as const,
    employees: 800
  },
  {
    name: "EduTech Academy",
    email: "info@edutech.edu",
    phone: "+1-555-0505",
    address: "654 Learning Lane, Austin, TX 73301",
    industry: "Education",
    website: "https://edutech.edu",
    description: "Online education platform for K-12 students",
    businessUseCase: "Learning Management System",
    techStack: "React, Node.js, PostgreSQL, DigitalOcean",
    health: 88,
    revenue: 1200000.00,
    renewalDate: new Date("2024-07-15"),
    arr: 1200000.00,
    riskScore: 12,
    lastTouchpoint: new Date("2024-01-18"),
    nextScheduled: new Date("2024-02-02"),
    accountManager: "Amanda White",
    customerSuccessManager: "Daniel Kim",
    salesEngineer: "Sophia Garcia",
    status: "active" as const,
    employees: 120
  }
];

const sampleContacts = [
  // TechCorp Solutions contacts
  {
    firstName: "Jennifer",
    lastName: "Smith",
    email: "jennifer.smith@techcorp.com",
    phone: "+1-555-0101",
    title: "CTO",
    isPrimary: true
  },
  {
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.johnson@techcorp.com",
    phone: "+1-555-0102",
    title: "VP of Engineering",
    isPrimary: false
  },
  // Global Retail contacts
  {
    firstName: "Patricia",
    lastName: "Williams",
    email: "patricia.williams@globalretail.com",
    phone: "+1-555-0201",
    title: "CIO",
    isPrimary: true
  },
  {
    firstName: "James",
    lastName: "Brown",
    email: "james.brown@globalretail.com",
    phone: "+1-555-0202",
    title: "IT Director",
    isPrimary: false
  },
  // HealthTech contacts
  {
    firstName: "Linda",
    lastName: "Davis",
    email: "linda.davis@healthtech.com",
    phone: "+1-555-0301",
    title: "CEO",
    isPrimary: true
  },
  {
    firstName: "Christopher",
    lastName: "Miller",
    email: "christopher.miller@healthtech.com",
    phone: "+1-555-0302",
    title: "CTO",
    isPrimary: false
  },
  // FinanceFirst contacts
  {
    firstName: "Barbara",
    lastName: "Wilson",
    email: "barbara.wilson@financefirst.com",
    phone: "+1-555-0401",
    title: "CIO",
    isPrimary: true
  },
  {
    firstName: "Richard",
    lastName: "Moore",
    email: "richard.moore@financefirst.com",
    phone: "+1-555-0402",
    title: "VP of Technology",
    isPrimary: false
  },
  // EduTech contacts
  {
    firstName: "Susan",
    lastName: "Taylor",
    email: "susan.taylor@edutech.edu",
    phone: "+1-555-0501",
    title: "CTO",
    isPrimary: true
  },
  {
    firstName: "Joseph",
    lastName: "Anderson",
    email: "joseph.anderson@edutech.edu",
    phone: "+1-555-0502",
    title: "VP of Product",
    isPrimary: false
  }
];

const sampleTasks = [
  {
    title: "Implement SSO Integration",
    description: "Set up Single Sign-On integration for TechCorp's enterprise users",
    status: "In Progress" as const,
    priority: "High" as const,
    dueDate: new Date("2024-02-15"),
    assignedTo: ["Alex Rodriguez"],
    assignedToClient: ["Michael Johnson"],
    accountName: "TechCorp Solutions",
    subTasks: [
      { id: 1, title: "Configure SAML provider", completed: true },
      { id: 2, title: "Test authentication flow", completed: false },
      { id: 3, title: "Deploy to production", completed: false }
    ],
    dependencies: [],
    isDependent: false,
    progress: 60
  },
  {
    title: "Performance Optimization Review",
    description: "Review and optimize database queries for Global Retail's e-commerce platform",
    status: "To Do" as const,
    priority: "Medium" as const,
    dueDate: new Date("2024-02-28"),
    assignedTo: ["Tom Anderson"],
    assignedToClient: ["James Brown"],
    accountName: "Global Retail Inc",
    subTasks: [
      { id: 1, title: "Analyze current performance", completed: false },
      { id: 2, title: "Identify bottlenecks", completed: false },
      { id: 3, title: "Implement optimizations", completed: false }
    ],
    dependencies: [],
    isDependent: false,
    progress: 0
  },
  {
    title: "HIPAA Compliance Audit",
    description: "Conduct HIPAA compliance audit for HealthTech's patient data handling",
    status: "Completed" as const,
    priority: "High" as const,
    dueDate: new Date("2024-01-30"),
    assignedTo: ["Rachel Green"],
    assignedToClient: ["Christopher Miller"],
    accountName: "HealthTech Innovations",
    subTasks: [
      { id: 1, title: "Review data encryption", completed: true },
      { id: 2, title: "Audit access controls", completed: true },
      { id: 3, title: "Document compliance", completed: true }
    ],
    dependencies: [],
    isDependent: false,
    progress: 100
  },
  {
    title: "Security Vulnerability Assessment",
    description: "Perform security assessment for FinanceFirst's banking platform",
    status: "In Progress" as const,
    priority: "High" as const,
    dueDate: new Date("2024-02-10"),
    assignedTo: ["Kevin Martinez"],
    assignedToClient: ["Richard Moore"],
    accountName: "FinanceFirst Bank",
    subTasks: [
      { id: 1, title: "Penetration testing", completed: true },
      { id: 2, title: "Code security review", completed: false },
      { id: 3, title: "Security report", completed: false }
    ],
    dependencies: [],
    isDependent: false,
    progress: 40
  },
  {
    title: "Mobile App Development",
    description: "Develop mobile application for EduTech's learning platform",
    status: "To Do" as const,
    priority: "Medium" as const,
    dueDate: new Date("2024-03-15"),
    assignedTo: ["Sophia Garcia"],
    assignedToClient: ["Joseph Anderson"],
    accountName: "EduTech Academy",
    subTasks: [
      { id: 1, title: "Design UI/UX", completed: false },
      { id: 2, title: "Develop iOS app", completed: false },
      { id: 3, title: "Develop Android app", completed: false }
    ],
    dependencies: [],
    isDependent: false,
    progress: 0
  }
];

const sampleNotes = [
  {
    content: "Initial kickoff meeting completed. TechCorp team is very engaged and has clear requirements for SSO integration. Timeline agreed upon for Q1 completion.",
    author: "Sarah Johnson",
    type: "meeting" as const,
    tags: ["kickoff", "sso", "timeline"],
    isPrivate: false
  },
  {
    content: "Follow-up call with Global Retail IT team. They're experiencing performance issues during peak shopping hours. Need to prioritize optimization work.",
    author: "David Wilson",
    type: "call" as const,
    tags: ["performance", "urgent", "optimization"],
    isPrivate: false
  },
  {
    content: "HIPAA compliance audit completed successfully. All requirements met. HealthTech team was very cooperative throughout the process.",
    author: "Rachel Green",
    type: "general" as const,
    tags: ["compliance", "hipaa", "completed"],
    isPrivate: false
  },
  {
    content: "Security assessment in progress. Found some minor vulnerabilities that need addressing. Will provide detailed report next week.",
    author: "Kevin Martinez",
    type: "general" as const,
    tags: ["security", "assessment", "vulnerabilities"],
    isPrivate: true
  },
  {
    content: "Mobile app development planning session with EduTech team. They want to target both iOS and Android platforms. Timeline: 3 months.",
    author: "Sophia Garcia",
    type: "meeting" as const,
    tags: ["mobile", "planning", "timeline"],
    isPrivate: false
  }
];

const sampleHealthScores = [
  {
    score: 85,
    factors: ["High engagement", "On-time payments", "Active usage"],
    date: new Date("2024-01-01")
  },
  {
    score: 72,
    factors: ["Payment delays", "Reduced usage", "Support tickets"],
    date: new Date("2024-01-01")
  },
  {
    score: 95,
    factors: ["Excellent engagement", "Early payments", "Feature adoption"],
    date: new Date("2024-01-01")
  },
  {
    score: 60,
    factors: ["Payment issues", "Low engagement", "Contract concerns"],
    date: new Date("2024-01-01")
  },
  {
    score: 88,
    factors: ["Good engagement", "Regular payments", "Growing usage"],
    date: new Date("2024-01-01")
  }
];

const sampleActivities = [
  {
    type: "Meeting",
    description: "Quarterly business review with TechCorp leadership team",
    date: new Date("2024-01-15")
  },
  {
    type: "Support Call",
    description: "Performance troubleshooting session with Global Retail IT team",
    date: new Date("2024-01-10")
  },
  {
    type: "Training",
    description: "New feature training session for HealthTech development team",
    date: new Date("2024-01-20")
  },
  {
    type: "Contract Review",
    description: "Contract renewal discussion with FinanceFirst stakeholders",
    date: new Date("2024-01-05")
  },
  {
    type: "Product Demo",
    description: "Mobile app demo for EduTech product team",
    date: new Date("2024-01-18")
  }
];

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Clear existing data using CASCADE to handle foreign key constraints (do not touch users)
    console.log("🗑️ Clearing existing non-user data...");
    await AppDataSource.query('TRUNCATE TABLE account_activities, health_scores, notes, tasks, contacts, accounts, account_tiers CASCADE');

    // Create admin user
    console.log("👤 Ensuring admin user exists...");
    const userRepository = AppDataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({ where: { email: "admin@crm.com" } });
    if (!existingAdmin) {
      const adminUser = userRepository.create({
        email: "admin@crm.com",
        name: "Admin User",
        password: "admin123",
        legacyRole: "admin"
      });
      await userRepository.save(adminUser);
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already present");
    }

    // Create account tiers
    console.log("🏷️ Creating account tiers...");
    const tierRepository = AppDataSource.getRepository(AccountTier);
    const createdTiers = await Promise.all(
      accountTiers.map(tier => {
        const newTier = tierRepository.create(tier);
        return tierRepository.save(newTier);
      })
    );
    console.log("✅ Account tiers created");

    // Create accounts
    console.log("🏢 Creating accounts...");
    const accountRepository = AppDataSource.getRepository(Account);
    const createdAccounts = await Promise.all(
      sampleAccounts.map((account, index) => {
        const newAccount = accountRepository.create({
          ...account,
          tierId: createdTiers[index % createdTiers.length].id
        });
        return accountRepository.save(newAccount);
      })
    );
    console.log("✅ Accounts created");

    // Create contacts
    console.log("👥 Creating contacts...");
    const contactRepository = AppDataSource.getRepository(Contact);
    const createdContacts = await Promise.all(
      sampleContacts.map((contact, index) => {
        const newContact = contactRepository.create({
          ...contact,
          accountId: createdAccounts[Math.floor(index / 2)].id
        });
        return contactRepository.save(newContact);
      })
    );
    console.log("✅ Contacts created");

    // Create tasks
    console.log("📋 Creating tasks...");
    const taskRepository = AppDataSource.getRepository(Task);
    const createdTasks = await Promise.all(
      sampleTasks.map((task, index) => {
        const newTask = taskRepository.create({
          ...task,
          accountId: createdAccounts[index].id
        });
        return taskRepository.save(newTask);
      })
    );
    console.log("✅ Tasks created");

    // Create notes (many-to-many with contacts via note_contacts)
    console.log("📝 Creating notes...");
    const noteRepository = AppDataSource.getRepository(Note);
    const createdNotes = await Promise.all(
      sampleNotes.map(async (note, index) => {
        const newNote = noteRepository.create({
          ...note,
          accountId: createdAccounts[index].id,
        });
        const saved = await noteRepository.save(newNote);
        const contact = createdContacts[index * 2];
        if (contact) {
          saved.contacts = [contact];
          await noteRepository.save(saved);
        }
        return saved;
      })
    );
    console.log("✅ Notes created");

    // Create health scores
    console.log("📊 Creating health scores...");
    const healthScoreRepository = AppDataSource.getRepository(HealthScore);
    const createdHealthScores = await Promise.all(
      sampleHealthScores.map((healthScore, index) => {
        const newHealthScore = healthScoreRepository.create({
          ...healthScore,
          accountId: createdAccounts[index].id
        });
        return healthScoreRepository.save(newHealthScore);
      })
    );
    console.log("✅ Health scores created");

    // Create account activities
    console.log("📈 Creating account activities...");
    const activityRepository = AppDataSource.getRepository(AccountActivity);
    const createdActivities = await Promise.all(
      sampleActivities.map((activity, index) => {
        const newActivity = activityRepository.create({
          ...activity,
          accountId: createdAccounts[index].id
        });
        return activityRepository.save(newActivity);
      })
    );
    console.log("✅ Account activities created");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`📊 Created:`);
    console.log(`   - ${createdTiers.length} account tiers`);
    console.log(`   - ${createdAccounts.length} accounts`);
    console.log(`   - ${createdContacts.length} contacts`);
    console.log(`   - ${createdTasks.length} tasks`);
    console.log(`   - ${createdNotes.length} notes`);
    console.log(`   - ${createdHealthScores.length} health scores`);
    console.log(`   - ${createdActivities.length} account activities`);
    console.log(`   - 1 admin user (admin@crm.com / admin123)`);

    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase(); 