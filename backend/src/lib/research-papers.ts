export interface ResearchPaper {
  id: string
  title: string
  subtitle: string
  abstract: string
  authors: {
    name: string
    affiliation: string
    email?: string
  }[]
  publishedAt: string
  updatedAt?: string
  category: string
  tags: string[]
  downloadUrl?: string
  citationCount?: number
  doi?: string
  venue?: string
  status: 'published' | 'preprint' | 'under-review'
  featured: boolean
}

export const researchPapers: ResearchPaper[] = [
  {
    id: "1",
    title: "Adaptive Memory Systems in Conversational AI",
    subtitle: "A Novel Approach to Persistent Context Management in Large Language Models",
    abstract: `This paper presents a novel approach to implementing persistent memory systems in conversational AI that enables continuous learning and context retention across sessions. Unlike traditional stateless models, our proposed architecture maintains semantic representations of user interactions while preserving privacy through differential privacy techniques. We introduce the Adaptive Memory Framework (AMF), which dynamically balances memory retention with computational efficiency. Experimental results demonstrate a 45% improvement in contextual relevance and a 60% reduction in repetitive information requests compared to baseline models. Our approach shows particular strength in long-term collaborative tasks, technical support scenarios, and creative workflows where session continuity is critical.`,
    authors: [
      {
        name: "Dr. Sarah Chen",
        affiliation: "Lotus AI Research Lab",
        email: "s.chen@lotus.ai"
      },
      {
        name: "Dr. Michael Rodriguez",
        affiliation: "Stanford University",
        email: "mrodriguez@stanford.edu"
      },
      {
        name: "Prof. Elena Kowalski",
        affiliation: "MIT Computer Science",
        email: "ekowalski@mit.edu"
      }
    ],
    publishedAt: "2024-01-20",
    category: "Machine Learning",
    tags: ["Memory Systems", "Conversational AI", "Contextual Learning", "User Experience"],
    downloadUrl: "/papers/adaptive-memory-systems.pdf",
    citationCount: 127,
    doi: "10.1000/lotus.2024.memory.001",
    venue: "International Conference on Machine Learning (ICML) 2024",
    status: "published",
    featured: true
  },
  {
    id: "2",
    title: "Privacy-Preserving AI Training Methods",
    subtitle: "Federated Learning Approaches for Personal AI Systems",
    abstract: `As AI systems become more personalized and context-aware, privacy concerns have intensified. This paper explores federated learning approaches specifically designed for personal AI systems that need to learn from user interactions without compromising privacy. We propose the Privacy-First Learning Protocol (PFLP), which enables AI systems to improve through user feedback while ensuring that raw user data never leaves the user's device. Our method employs homomorphic encryption and secure aggregation to allow model updates without exposing individual user information. Validation across diverse user scenarios shows that PFLP maintains 98% of the learning effectiveness of centralized approaches while providing mathematical privacy guarantees. The framework is particularly effective for personal assistant applications where trust and privacy are paramount.`,
    authors: [
      {
        name: "Dr. Marcus Thompson",
        affiliation: "Lotus AI Research Lab",
        email: "m.thompson@lotus.ai"
      },
      {
        name: "Dr. Yuki Tanaka",
        affiliation: "Tokyo Institute of Technology",
        email: "ytanaka@titech.ac.jp"
      },
      {
        name: "Dr. Lisa Zhang",
        affiliation: "University of Toronto",
        email: "lzhang@utoronto.ca"
      }
    ],
    publishedAt: "2024-01-15",
    category: "Privacy & Security",
    tags: ["Federated Learning", "Privacy", "Differential Privacy", "Secure Computation"],
    downloadUrl: "/papers/privacy-preserving-training.pdf",
    citationCount: 89,
    doi: "10.1000/lotus.2024.privacy.002",
    venue: "IEEE Symposium on Security and Privacy 2024",
    status: "published",
    featured: true
  },
  {
    id: "3",
    title: "User Personalization in Large Language Models",
    subtitle: "Balancing Adaptation and Generalization in AI Systems",
    abstract: `This research investigates the optimal balance between user-specific adaptation and general capability preservation in large language models. We introduce the Personalization-Generalization Trade-off Framework (PGTF) and demonstrate how AI systems can adapt to individual users without losing their broad knowledge base. Our approach uses parameter-efficient fine-tuning combined with attention-based user modeling to create personalized AI experiences. Through extensive evaluation with 10,000 users across diverse domains, we show that personalized models achieve 35% better task completion rates while maintaining 99% of their general knowledge capabilities. The study provides important insights into user preference modeling, adaptation strategies, and the technical requirements for building truly personal AI assistants.`,
    authors: [
      {
        name: "Dr. Elena Rodriguez",
        affiliation: "Lotus AI Research Lab",
        email: "e.rodriguez@lotus.ai"
      },
      {
        name: "Dr. James Wilson",
        affiliation: "Carnegie Mellon University",
        email: "jwilson@cmu.edu"
      },
      {
        name: "Dr. Priya Sharma",
        affiliation: "Google DeepMind",
        email: "psharma@google.com"
      }
    ],
    publishedAt: "2024-01-10",
    category: "Natural Language Processing",
    tags: ["Personalization", "User Modeling", "Adaptation", "Parameter Efficiency"],
    downloadUrl: "/papers/user-personalization-llm.pdf",
    citationCount: 156,
    doi: "10.1000/lotus.2024.personalization.003",
    venue: "Association for Computational Linguistics (ACL) 2024",
    status: "published",
    featured: true
  },
  {
    id: "4",
    title: "Multimodal AI Systems: Beyond Text",
    subtitle: "Integrating Vision, Audio, and Text for Comprehensive AI Understanding",
    abstract: `Current AI systems excel in single modalities but struggle with truly integrated multimodal understanding. This paper presents the Unified Multimodal Architecture (UMA), which seamlessly processes text, images, audio, and video in a shared semantic space. Our approach uses cross-modal attention mechanisms and contrastive learning to create rich, integrated representations. UMA demonstrates superior performance on complex tasks requiring understanding across modalities, such as video summarization with textual queries, image editing with natural language instructions, and audio-visual content creation. Evaluation on standard benchmarks shows 25% improvement over previous multimodal systems, with particular strength in creative and analytical tasks that require synthesis across different types of input.`,
    authors: [
      {
        name: "Dr. Alex Kim",
        affiliation: "Lotus AI Research Lab",
        email: "a.kim@lotus.ai"
      },
      {
        name: "Dr. Rachel Green",
        affiliation: "UC Berkeley",
        email: "rgreen@berkeley.edu"
      },
      {
        name: "Dr. Ahmed Hassan",
        affiliation: "Microsoft Research",
        email: "ahassan@microsoft.com"
      }
    ],
    publishedAt: "2024-01-05",
    category: "Computer Vision",
    tags: ["Multimodal Learning", "Computer Vision", "Cross-Modal", "Representation Learning"],
    downloadUrl: "/papers/multimodal-ai-systems.pdf",
    citationCount: 93,
    doi: "10.1000/lotus.2024.multimodal.004",
    venue: "Computer Vision and Pattern Recognition (CVPR) 2024",
    status: "published",
    featured: false
  },
  {
    id: "5",
    title: "The Economics of Personal AI Assistants",
    subtitle: "Cost-Benefit Analysis of Different AI Service Models",
    abstract: `This interdisciplinary study examines the economic implications of different AI service models, comparing data-harvesting "free" services with direct-payment models. We analyze total cost of ownership, value creation, privacy costs, and innovation incentives across different approaches. Our economic modeling reveals that while free services appear cost-effective in the short term, direct-payment models create superior long-term value for both users and society. Key findings include: (1) Hidden costs of free services average $180/year per user in lost privacy and productivity, (2) Direct-payment models encourage 40% more innovation in user-beneficial features, (3) Privacy-preserving approaches generate 3x more user value over 5-year periods. The research provides a framework for evaluating AI service models beyond simple cost comparisons.`,
    authors: [
      {
        name: "Dr. David Park",
        affiliation: "Lotus AI Research Lab",
        email: "d.park@lotus.ai"
      },
      {
        name: "Prof. Jennifer Liu",
        affiliation: "Harvard Business School",
        email: "jliu@hbs.edu"
      },
      {
        name: "Dr. Roberto Silva",
        affiliation: "London School of Economics",
        email: "r.silva@lse.ac.uk"
      }
    ],
    publishedAt: "2023-12-28",
    category: "Economics",
    tags: ["AI Economics", "Business Models", "Privacy Economics", "Innovation"],
    downloadUrl: "/papers/economics-personal-ai.pdf",
    citationCount: 67,
    doi: "10.1000/lotus.2023.economics.005",
    venue: "Journal of AI Economics and Policy",
    status: "published",
    featured: false
  },
  {
    id: "6",
    title: "Temporal Reasoning in AI Memory Systems",
    subtitle: "Understanding How Context Changes Over Time",
    abstract: `This paper addresses a critical gap in AI memory systems: understanding how user needs, preferences, and contexts evolve over time. We introduce Temporal Context Weighting (TCW), a novel approach that allows AI systems to appropriately weight historical information based on temporal relevance and user evolution. Our method uses decay functions, context similarity measures, and explicit user feedback to maintain relevant long-term memory while adapting to changing user needs. Experimental validation shows 50% improvement in response relevance for users whose preferences have evolved, while maintaining high performance for stable users. The approach is particularly valuable for AI systems supporting long-term projects, learning goals, and evolving professional needs.`,
    authors: [
      {
        name: "Dr. Nina Petrov",
        affiliation: "Lotus AI Research Lab",
        email: "n.petrov@lotus.ai"
      },
      {
        name: "Dr. Kevin O'Brien",
        affiliation: "Oxford University",
        email: "kobrien@ox.ac.uk"
      }
    ],
    publishedAt: "2023-12-15",
    updatedAt: "2024-01-03",
    category: "Machine Learning",
    tags: ["Temporal Reasoning", "Memory Systems", "Context Evolution", "User Adaptation"],
    downloadUrl: "/papers/temporal-reasoning-memory.pdf",
    citationCount: 34,
    doi: "10.1000/lotus.2023.temporal.006",
    venue: "Neural Information Processing Systems (NeurIPS) 2023",
    status: "published",
    featured: false
  }
]

export const researchCategories = [
  "All",
  "Machine Learning",
  "Privacy & Security",
  "Natural Language Processing",
  "Computer Vision",
  "Economics",
  "Human-Computer Interaction"
]

export const researchTags = [
  "Memory Systems",
  "Conversational AI",
  "Contextual Learning",
  "User Experience",
  "Federated Learning",
  "Privacy",
  "Differential Privacy",
  "Secure Computation",
  "Personalization",
  "User Modeling",
  "Adaptation",
  "Parameter Efficiency",
  "Multimodal Learning",
  "Computer Vision",
  "Cross-Modal",
  "Representation Learning",
  "AI Economics",
  "Business Models",
  "Privacy Economics",
  "Innovation",
  "Temporal Reasoning",
  "Context Evolution",
  "User Adaptation"
]

export function getResearchPaper(id: string): ResearchPaper | undefined {
  return researchPapers.find(paper => paper.id === id)
}

export function getFeaturedPapers(): ResearchPaper[] {
  return researchPapers.filter(paper => paper.featured)
}

export function getPapersByCategory(category: string): ResearchPaper[] {
  if (category === "All") return researchPapers
  return researchPapers.filter(paper => paper.category === category)
}

export function getPapersByTag(tag: string): ResearchPaper[] {
  return researchPapers.filter(paper => paper.tags.includes(tag))
}

export function getRelatedPapers(currentPaper: ResearchPaper, limit: number = 3): ResearchPaper[] {
  return researchPapers
    .filter(paper =>
      paper.id !== currentPaper.id &&
      (paper.category === currentPaper.category ||
       paper.tags.some(tag => currentPaper.tags.includes(tag)))
    )
    .slice(0, limit)
}