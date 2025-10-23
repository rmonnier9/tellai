import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  console.log('👤 Creating users...');
  const robinAdminUser = await prisma.user.create({
    data: {
      id: '41z9i8XenmgwFORQ48JpTN04hy5UzQra',
      name: 'Robin Rank',
      email: 'robin@lovarank.com',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-17T09:29:18.255Z',
      updatedAt: '2025-10-17T09:29:18.662Z',
      stripeCustomerId: 'cus_TFfIoS3oCWs6eE',
      banExpires: null,
      banReason: null,
      banned: false,
      role: 'user',
    },
  });

  const georgesAdminUser = await prisma.user.create({
    data: {
      id: 'GeorgesUser123456789ABCDEF012345',
      name: 'Georges Lovarank',
      email: 'georges@lovarank.com',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-23T10:00:00.000Z',
      updatedAt: '2025-10-23T10:00:00.000Z',
      stripeCustomerId: null,
      banExpires: null,
      banReason: null,
      banned: false,
      role: 'user',
    },
  });

  const robinRegularUser = await prisma.user.create({
    data: {
      id: 'Xz7ZjwJY2EiAamh9L4GvSvkgkcRzUMaF',
      name: '',
      email: 'robin+dev@lovarank.com',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-17T10:08:01.322Z',
      updatedAt: '2025-10-17T10:08:01.642Z',
      stripeCustomerId: 'cus_TFfv1wrgddDK6x',
      banExpires: null,
      banReason: null,
      banned: false,
      role: 'user',
    },
  });

  const georgesRegularUser = await prisma.user.create({
    data: {
      id: 'GeorgesRegular456789ABCDEF0123456',
      name: '',
      email: 'georges+dev@lovarank.com',
      emailVerified: true,
      image: null,
      createdAt: '2025-10-23T10:00:01.000Z',
      updatedAt: '2025-10-23T10:00:01.000Z',
      stripeCustomerId: null,
      banExpires: null,
      banReason: null,
      banned: false,
      role: 'user',
    },
  });

  // Create organizations
  console.log('🏢 Creating organizations...');
  const mainOrg = await prisma.organization.create({
    data: {
      id: 'lr5jsk73iksrcz5yxj372yav',
      name: 'Team lr5j',
      slug: 'lr5jsk73iksrcz5yxj372yav',
      logo: null,
      metadata: null,
      createdAt: '2025-10-17T09:29:18.680Z',
    },
  });

  const clientOrg = await prisma.organization.create({
    data: {
      id: 'nnbo3y76w3e3oikag6nvav1b',
      name: 'Team nnbo',
      slug: 'nnbo3y76w3e3oikag6nvav1b',
      logo: null,
      metadata: null,
      createdAt: '2025-10-17T10:08:01.658Z',
    },
  });

  // Create members
  console.log('👥 Creating members...');
  await prisma.member.create({
    data: {
      id: 'cmgund6cd0000utvdv4m8ozxz',
      organizationId: 'lr5jsk73iksrcz5yxj372yav',
      userId: '41z9i8XenmgwFORQ48JpTN04hy5UzQra',
      role: 'owner',
      createdAt: '2025-10-17T09:29:18.680Z',
    },
  });

  await prisma.member.create({
    data: {
      id: 'cmguoqyrj00003qvdqua87nnp',
      organizationId: 'nnbo3y76w3e3oikag6nvav1b',
      userId: 'Xz7ZjwJY2EiAamh9L4GvSvkgkcRzUMaF',
      role: 'owner',
      createdAt: '2025-10-17T10:08:01.658Z',
    },
  });

  await prisma.member.create({
    data: {
      id: 'cmgeorges00001member00000001',
      organizationId: 'lr5jsk73iksrcz5yxj372yav',
      userId: 'GeorgesUser123456789ABCDEF012345',
      role: 'owner',
      createdAt: '2025-10-23T10:00:00.000Z',
    },
  });

  await prisma.member.create({
    data: {
      id: 'cmgeorgesreg002member00000002',
      organizationId: 'nnbo3y76w3e3oikag6nvav1b',
      userId: 'GeorgesRegular456789ABCDEF0123456',
      role: 'owner',
      createdAt: '2025-10-23T10:00:01.000Z',
    },
  });

  // Create subscriptions
  console.log('💳 Creating subscriptions...');
  const proSubscription = await prisma.subscription.create({
    data: {
      id: 'qYlH2yKtVaPt6O2r1BXCvmlU2nYITkIJ',
      plan: 'premium',
      referenceId: 'cmguorgij00013qvdbo96199n',
      stripeCustomerId: 'cus_TFfv1wrgddDK6x',
      stripeSubscriptionId: null,
      status: 'incomplete',
      periodStart: null,
      periodEnd: null,
      trialStart: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      seats: 1,
    },
  });

  const basicSubscription = await prisma.subscription.create({
    data: {
      id: 'gTUUOeLll6tYk63ObRZnW86v8SCH1mug',
      plan: 'premium',
      referenceId: 'cmgune7390001utvdg8uhce0d',
      stripeCustomerId: 'cus_TFfIoS3oCWs6eE',
      stripeSubscriptionId: 'sub_1SJAgRCrZMTHvTEkeBNY3vXZ',
      status: 'trialing',
      periodStart: '2025-10-17T10:14:49.000Z',
      periodEnd: '2025-10-20T10:14:49.000Z',
      trialStart: '2025-10-17T10:14:49.000Z',
      trialEnd: '2025-10-20T10:14:49.000Z',
      cancelAtPeriodEnd: false,
      seats: 1,
    },
  });
  const basicSubscription2 = await prisma.subscription.create({
    data: {
      id: 'x8VEyhxn1ff7R8l2yS70fPhRaEkCkPvW',
      plan: 'premium',
      referenceId: 'cmgv0afhq0001livdzjq3dpkr',
      stripeCustomerId: 'cus_TFfIoS3oCWs6eE',
      stripeSubscriptionId: 'sub_1SJFdZCrZMTHvTEknFhEd9Mc',
      status: 'trialing',
      periodStart: '2025-10-17T15:32:11.000Z',
      periodEnd: '2025-10-20T15:32:11.000Z',
      trialStart: '2025-10-17T15:32:11.000Z',
      trialEnd: '2025-10-20T15:32:11.000Z',
      cancelAtPeriodEnd: false,
      seats: 1,
    },
  });

  // Create products
  console.log('📦 Creating products...');
  const mainProduct = await prisma.product.create({
    data: {
      id: 'cmguorgij00013qvdbo96199n',
      url: 'https://www.lovarank.com',
      name: 'Lovarank',
      description:
        "Lovarank is an AI-powered SEO automation platform that functions as a growth engine for organic traffic. The service automatically discovers hidden, low-competition keywords in specific niches, generates optimized articles, and publishes content daily. It's designed to improve visibility on Google and AI search engines like ChatGPT and Perplexity with minimal manual effort. The platform offers native integrations and operates on a set-it-and-forget-it model, allowing the AI agent to continuously work on growing organic traffic while users focus on other aspects of their business.",
      logo: 'http://localhost:9000/lovarank/uploads/t4krwig9kw9dxlhail32a4ep.vnd.microsoft.icon',
      language: 'en',
      country: 'US',
      targetAudiences: [
        'Digital marketers seeking automated SEO solutions',
        'Content creators and bloggers',
        'Small to medium-sized business owners',
        'SaaS companies looking to scale organic traffic',
        'Marketing agencies managing multiple client websites',
      ],
      sitemapUrl: null,
      blogUrl: null,
      bestArticles: [],
      autoPublish: true,
      articleStyle: 'informative',
      internalLinks: 3,
      globalInstructions: null,
      imageStyle: 'brand-text',
      brandColor: '#000000',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: true,
      subscriptionId: null,
      organizationId: 'nnbo3y76w3e3oikag6nvav1b',
      createdAt: '2025-10-17T10:08:24.664Z',
      updatedAt: '2025-10-17T10:08:24.664Z',
    },
  });

  const clientProduct = await prisma.product.create({
    data: {
      id: 'cmgune7390001utvdg8uhce0d',
      url: 'https://chatbase.co/',
      name: 'Chatbase',
      description:
        'Chatbase is a complete platform for building and deploying AI support agents for customer service. It enables businesses to create AI-powered chatbots and agents that handle complex customer queries using advanced language models with reasoning capabilities. The platform is designed to be accessible to users without technical skills, allowing them to easily create, manage, and deploy AI agents that improve customer experiences and business outcomes.',
      logo: 'http://localhost:9000/lovarank/uploads/xsprkemms4qobgeh3dzgaxc0.x-icon',
      language: 'en',
      country: 'US',
      targetAudiences: [
        'Businesses seeking AI customer service solutions',
        'Customer support teams and managers',
        'E-commerce companies needing automated support',
        'SaaS companies requiring scalable customer service',
        'Small to medium businesses without technical teams',
      ],
      sitemapUrl: 'https://chatbase.co/sitemap.xml',
      blogUrl: null,
      bestArticles: [],
      autoPublish: true,
      articleStyle: 'informative',
      internalLinks: 3,
      globalInstructions: null,
      imageStyle: 'brand-text',
      brandColor: '#000000',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: true,
      subscriptionId: 'gTUUOeLll6tYk63ObRZnW86v8SCH1mug',
      organizationId: 'lr5jsk73iksrcz5yxj372yav',
      createdAt: '2025-10-17T09:30:06.304Z',
      updatedAt: '2025-10-17T10:14:52.978Z',
    },
  });

  const clientProduct2 = await prisma.product.create({
    data: {
      id: 'cmgv0afhq0001livdzjq3dpkr',
      url: 'https://zenfirst.fr',
      name: 'Zenfirst',
      description:
        "Zenfirst propose des logiciels de gestion d'entreprise simples et fiables pour simplifier le quotidien des professionnels. La solution comprend deux produits principaux : Zenfirst Tréso pour la gestion et la visualisation de la trésorerie en temps réel, permettant d'anticiper les flux financiers et d'identifier les tensions de trésorerie, et Zenfirst Gesco (anciennement Zenfirst Facture) pour la gestion de l'activité commerciale. Ces outils permettent aux entreprises d'avoir une vision claire de leurs finances et de prendre des décisions éclairées sans avoir recours à des tableurs complexes.",
      logo: 'http://localhost:9000/lovarank/uploads/bb6j3yo82qrj2l4hdxerv1p9.png',
      language: 'fr',
      country: 'FR',
      targetAudiences: [
        'TPE et PME',
        "Entrepreneurs et chefs d'entreprise",
        'Dirigeants souhaitant piloter leur trésorerie',
        'Professionnels cherchant à simplifier leur gestion financière',
        'Entreprises de plus de 1000 utilisateurs',
      ],
      sitemapUrl: 'https://zenfirst.fr/sitemap_index.xml',
      blogUrl: null,
      bestArticles: [],
      autoPublish: true,
      articleStyle: 'informative',
      internalLinks: 3,
      globalInstructions: null,
      imageStyle: 'brand-text',
      brandColor: '#000000',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: true,
      subscriptionId: 'x8VEyhxn1ff7R8l2yS70fPhRaEkCkPvW',
      organizationId: 'lr5jsk73iksrcz5yxj372yav',
      createdAt: '2025-10-17T15:31:05.578Z',
      updatedAt: '2025-10-17T15:32:15.072Z',
    },
  });

  // Create credentials
  console.log('🔑 Creating credentials...');
  const wordpressCredential = await prisma.credential.create({
    data: {
      id: 'cmh0q77bp000a6svddu4yi85r',
      type: 'wordpress',
      name: 'WordPress - localhost',
      refreshToken: null,
      accessToken: 'wp_a6r21r89gx2xct0b1sxgf0uzu1c1m5',
      externalId: null,
      config: {
        siteUrl: 'http://localhost:8080',
        authorId: '',
        username: '',
        publishingStatus: 'draft',
        applicationPassword: 'wp_a6r21r89gx2xct0b1sxgf0uzu1c1m5',
      },
      productId: 'cmgv0afhq0001livdzjq3dpkr',
      createdAt: '2025-10-21T15:35:15.925Z',
      updatedAt: '2025-10-21T15:35:15.925Z',
    },
  });
  const wordpressCredential2 = await prisma.credential.create({
    data: {
      id: 'cmh0qb7dr000d6svdems30x80',
      type: 'wordpress',
      name: 'WordPress - wordpress-j8ngm.wasmer.app',
      refreshToken: null,
      accessToken: 'wp_r0bs5ek9a1nk5q0v2h0lagd5fzt42ybh',
      externalId: null,
      config: {
        siteUrl: 'https://wordpress-j8ngm.wasmer.app',
        authorId: '',
        username: '',
        publishingStatus: 'draft',
        applicationPassword: 'wp_r0bs5ek9a1nk5q0v2h0lagd5fzt42ybh',
      },
      productId: 'cmgv0afhq0001livdzjq3dpkr',
      createdAt: '2025-10-21T15:38:22.623Z',
      updatedAt: '2025-10-21T15:38:22.623Z',
    },
  });

  const webflowCredential = await prisma.credential.create({
    data: {
      id: 'cmh20mp7o00021xvd8kmxey1n',
      type: 'webflow',
      name: 'sdf',
      refreshToken: null,
      accessToken:
        '88f066cff3616c79d1920008b6aec135e3edec748495f239d786d85af3e206e8',
      externalId: null,
      config: {
        siteUrl: 'https://robins-exceptional-site-34be6d.webflow.io',
        collectionId: '68f0bcdc34d5e43fc8d14389',
        fieldMapping: {},
        publishingStatus: 'live',
      },
      productId: 'cmgv0afhq0001livdzjq3dpkr',
      createdAt: '2025-10-22T13:15:01.284Z',
      updatedAt: '2025-10-22T13:15:01.284Z',
    },
  });

  // Create articles
  console.log('📝 Creating articles...');
  const article1 = await prisma.article.create({
    data: {
      id: 'art_001',
      productId: clientProduct.id,
      keyword: 'prisma database seeding',
      title: 'How to Seed Your Prisma Database Effectively',
      type: 'guide',
      guideSubtype: 'how_to',
      searchVolume: 1200,
      keywordDifficulty: 45.5,
      cpc: 2.3,
      competition: 'medium',
      scheduledDate: new Date('2024-02-01'),
      status: 'published',
      content:
        'This is a comprehensive guide on how to effectively seed your Prisma database...',
      metaDescription:
        'Learn how to seed your Prisma database with sample data for development and testing.',
      publishedUrl: 'https://lovadesk.com/blog/prisma-database-seeding',
      featuredImageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    },
  });
  const article2 = await prisma.article.create({
    data: {
      id: 'art_002',
      productId: clientProduct.id,
      keyword: 'run a successful SEO campaign',
      title: 'How to run a successful SEO campaign',
      type: 'guide',
      guideSubtype: 'how_to',
      searchVolume: 1200,
      keywordDifficulty: 45.5,
      cpc: 2.3,
      competition: 'medium',
      scheduledDate: new Date('2024-02-02'),
      status: 'published',
      content:
        'This is a comprehensive guide on how to run a successful SEO campaign...',
      metaDescription: 'Learn how to run a successful SEO campaign...',
      publishedUrl: 'https://lovadesk.com/blog/prisma-database-seeding',
      featuredImageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    },
  });
  const article3 = await prisma.article.create({
    data: {
      id: 'art_003',
      productId: clientProduct.id,
      keyword: 'generate SEO content with AI',
      title: 'How to generate SEO content with AI',
      type: 'guide',
      guideSubtype: 'how_to',
      searchVolume: 1200,
      keywordDifficulty: 45.5,
      cpc: 2.3,
      competition: 'medium',
      scheduledDate: new Date('2024-02-03'),
      status: 'published',
      content:
        'This is a comprehensive guide on how to generate SEO content with AI...',
      metaDescription: 'Learn how to generate SEO content with AI...',
      publishedUrl: 'https://lovadesk.com/blog/prisma-database-seeding',
      featuredImageUrl:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
