import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const colleges = [
    { name: 'IIT Delhi', city: 'Delhi', state: 'Delhi', verified: true },
    { name: 'VIT Vellore', city: 'Vellore', state: 'Tamil Nadu', verified: true },
  ];

  for (const college of colleges) {
    await prisma.college.upsert({
      where: { name: college.name },
      update: college,
      create: college,
    });
  }

  const alumniProfiles = [
    {
      clerkId: 'clerk-alumni-google',
      email: 'sai@google.com',
      username: 'sai_gupta',
      name: 'Sai Gupta',
      role: 'ALUMNI',
      college: 'IIT Delhi',
      branch: 'Computer Science',
      graduationYear: 2019,
      bio: 'Backend engineer focused on scalable systems.',
      skills: ['Node.js', 'PostgreSQL', 'Docker'],
      domain: 'backend',
      currentCompany: 'Google',
      linkedinUrl: 'https://linkedin.com/in/saigupta',
      githubUrl: 'https://github.com/saigupta',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      campusCred: 420,
      isAvailable: true,
    },
    {
      clerkId: 'clerk-alumni-flipkart',
      email: 'nisha@flipkart.com',
      username: 'nisha_patel',
      name: 'Nisha Patel',
      role: 'ALUMNI',
      college: 'IIT Delhi',
      branch: 'Electronics',
      graduationYear: 2018,
      bio: 'Product-minded mentor with CPG and logistics experience.',
      skills: ['Python', 'ML', 'Kubernetes'],
      domain: 'ml',
      currentCompany: 'Flipkart',
      linkedinUrl: 'https://linkedin.com/in/nishapatel',
      githubUrl: 'https://github.com/nishapatel',
      avatarUrl: 'https://images.unsplash.com/photo-1547457936-7c41e22bc02b?auto=format&fit=crop&w=200&q=80',
      campusCred: 380,
      isAvailable: true,
    },
    {
      clerkId: 'clerk-alumni-razorpay',
      email: 'aman@razorpay.com',
      username: 'aman_sharma',
      name: 'Aman Sharma',
      role: 'ALUMNI',
      college: 'VIT Vellore',
      branch: 'Computer Science',
      graduationYear: 2017,
      bio: 'Fintech mentor who loves high-performance backend and payments.',
      skills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      domain: 'devops',
      currentCompany: 'Razorpay',
      linkedinUrl: 'https://linkedin.com/in/amansharma',
      githubUrl: 'https://github.com/amansharma',
      avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
      campusCred: 540,
      isAvailable: true,
    },
    {
      clerkId: 'clerk-alumni-swiggy',
      email: 'priya@swiggy.com',
      username: 'priya_menon',
      name: 'Priya Menon',
      role: 'ALUMNI',
      college: 'IIT Delhi',
      branch: 'Computer Science',
      graduationYear: 2016,
      bio: 'Mobile-first product and UX driven engineering leader.',
      skills: ['React', 'Mobile', 'UX'],
      domain: 'mobile',
      currentCompany: 'Swiggy',
      linkedinUrl: 'https://linkedin.com/in/priyamenon',
      githubUrl: 'https://github.com/priyamenon',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      campusCred: 480,
      isAvailable: true,
    },
    {
      clerkId: 'clerk-alumni-cred',
      email: 'tarun@cred.com',
      username: 'tarun_kumar',
      name: 'Tarun Kumar',
      role: 'ALUMNI',
      college: 'VIT Vellore',
      branch: 'Computer Science',
      graduationYear: 2015,
      bio: 'Data-driven engineer with product launch experience.',
      skills: ['Python', 'Data', 'SQL'],
      domain: 'data',
      currentCompany: 'CRED',
      linkedinUrl: 'https://linkedin.com/in/tarunkumar',
      githubUrl: 'https://github.com/tarunkumar',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      campusCred: 610,
      isAvailable: true,
    },
  ];

  for (const profile of alumniProfiles) {
    await prisma.user.upsert({
      where: { clerkId: profile.clerkId },
      update: {
        ...profile,
        role: profile.role as any,
      },
      create: {
        ...profile,
        role: profile.role as any,
      },
    });
  }

  const iitCollege = await prisma.college.findUnique({ where: { name: 'IIT Delhi' } });
  const vitCollege = await prisma.college.findUnique({ where: { name: 'VIT Vellore' } });

  if (!iitCollege || !vitCollege) throw new Error('Missing colleges for events');

  await prisma.event.upsert({
    where: { id: 'buildfast-2025' },
    update: {
      description: 'A 48-hour hackathon for product-builders with cash prizes and mentoring.',
      type: 'HACKATHON',
      startDate: new Date('2025-09-20T10:00:00Z'),
      registrationDeadline: new Date('2025-09-15T23:59:59Z'),
      prize: '₹50,000',
      teamSize: '1-3',
      tags: ['Fullstack', 'Product', 'Build'],
      link: 'https://campusbridge.io/buildfast',
      collegeId: iitCollege.id,
    },
    create: {
      id: 'buildfast-2025',
      title: 'BuildFast 2025',
      description: 'A 48-hour hackathon for product-builders with cash prizes and mentoring.',
      type: 'HACKATHON',
      collegeId: iitCollege.id,
      startDate: new Date('2025-09-20T10:00:00Z'),
      registrationDeadline: new Date('2025-09-15T23:59:59Z'),
      prize: '₹50,000',
      teamSize: '1-3',
      tags: ['Fullstack', 'Product', 'Build'],
      link: 'https://campusbridge.io/buildfast',
    },
  });

  await prisma.event.upsert({
    where: { id: 'cybersprint-2025' },
    update: {
      description: 'A capture-the-flag challenge for cyber defenders and hackers.',
      type: 'CTF',
      startDate: new Date('2025-10-10T09:00:00Z'),
      registrationDeadline: new Date('2025-10-08T23:59:59Z'),
      prize: 'Top performers win swag and certificates',
      teamSize: '2-4',
      tags: ['Security', 'CTF', 'Networking'],
      link: 'https://campusbridge.io/cybersprint',
      collegeId: vitCollege.id,
    },
    create: {
      id: 'cybersprint-2025',
      title: 'CyberSprint',
      description: 'A capture-the-flag challenge for cyber defenders and hackers.',
      type: 'CTF',
      collegeId: vitCollege.id,
      startDate: new Date('2025-10-10T09:00:00Z'),
      registrationDeadline: new Date('2025-10-08T23:59:59Z'),
      prize: 'Top performers win swag and certificates',
      teamSize: '2-4',
      tags: ['Security', 'CTF', 'Networking'],
      link: 'https://campusbridge.io/cybersprint',
    },
  });

  await prisma.event.upsert({
    where: { id: 'razorpay-intern-2025' },
    update: {
      description: 'Apply for a backend internship at Razorpay with hands-on mentorship.',
      type: 'INTERNSHIP',
      startDate: new Date('2025-06-01T10:00:00Z'),
      registrationDeadline: new Date('2025-05-20T23:59:59Z'),
      prize: 'Stipend + mentorship',
      teamSize: '1-1',
      tags: ['Internship', 'Fintech', 'Backend'],
      link: 'https://campusbridge.io/razorpay-intern',
      collegeId: vitCollege.id,
    },
    create: {
      id: 'razorpay-intern-2025',
      title: 'Summer SDE Intern @ Razorpay',
      description: 'Apply for a backend internship at Razorpay with hands-on mentorship.',
      type: 'INTERNSHIP',
      collegeId: vitCollege.id,
      startDate: new Date('2025-06-01T10:00:00Z'),
      registrationDeadline: new Date('2025-05-20T23:59:59Z'),
      prize: 'Stipend + mentorship',
      teamSize: '1-1',
      tags: ['Internship', 'Fintech', 'Backend'],
      link: 'https://campusbridge.io/razorpay-intern',
    },
  });

  const posts = [
    {
      authorClerkId: 'clerk-alumni-google',
      content: 'Always write documentation first, then code the API. Good design is visible in the docs.',
      type: 'TEXT',
    },
    {
      authorClerkId: 'clerk-alumni-flipkart',
      content: 'Want to build for scale? Start with a simple model and iterate using real user feedback.',
      type: 'TEXT',
    },
    {
      authorClerkId: 'clerk-alumni-razorpay',
      content: 'Fintech systems need observability from day one — logs, metrics, and alerts matter.',
      type: 'TEXT',
    },
  ];

  for (const post of posts) {
    const author = await prisma.user.findUnique({ where: { clerkId: post.authorClerkId } });
    if (!author) continue;
    await prisma.post.upsert({
      where: { id: `${author.id}-${post.type}` },
      update: {},
      create: {
        id: `${author.id}-${post.type}`,
        authorId: author.id,
        body: post.content,
        type: post.type as any,
      },
    });
  }

  console.log('Seed data created successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
