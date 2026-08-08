export interface SkillNode {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'ai_ml' | 'database' | 'mobile' | 'general';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  parentSkillId?: string;
  subSkills?: string[];
  relatedSkills?: string[];
}

export interface SkillGraph {
  userId: string;
  nodes: Record<string, SkillNode>;
  updatedAt: string;
}

export class SkillGraphService {
  private static instance: SkillGraphService;
  private userGraphs: Map<string, SkillGraph> = new Map();

  private constructor() {
    this.seedDefaultGraph('default-user-id');
  }

  public static getInstance(): SkillGraphService {
    if (!SkillGraphService.instance) {
      SkillGraphService.instance = new SkillGraphService();
    }
    return SkillGraphService.instance;
  }

  private seedDefaultGraph(userId: string) {
    const nodes: Record<string, SkillNode> = {
      javascript: {
        id: 'javascript',
        name: 'JavaScript',
        category: 'frontend',
        level: 'expert',
        yearsOfExperience: 5,
        subSkills: ['typescript', 'react', 'nodejs']
      },
      typescript: {
        id: 'typescript',
        name: 'TypeScript',
        category: 'frontend',
        level: 'advanced',
        yearsOfExperience: 4,
        parentSkillId: 'javascript'
      },
      react: {
        id: 'react',
        name: 'React',
        category: 'frontend',
        level: 'expert',
        yearsOfExperience: 4,
        parentSkillId: 'javascript',
        subSkills: ['redux', 'nextjs', 'zustand', 'react-query']
      },
      nextjs: {
        id: 'nextjs',
        name: 'Next.js',
        category: 'frontend',
        level: 'advanced',
        yearsOfExperience: 3,
        parentSkillId: 'react'
      },
      nodejs: {
        id: 'nodejs',
        name: 'Node.js',
        category: 'backend',
        level: 'advanced',
        yearsOfExperience: 4,
        parentSkillId: 'javascript',
        subSkills: ['express', 'nestjs', 'graphql', 'rest-api']
      },
      express: {
        id: 'express',
        name: 'Express.js',
        category: 'backend',
        level: 'advanced',
        yearsOfExperience: 4,
        parentSkillId: 'nodejs'
      },
      database: {
        id: 'database',
        name: 'Databases',
        category: 'database',
        level: 'advanced',
        yearsOfExperience: 4,
        subSkills: ['mongodb', 'postgresql', 'redis']
      },
      postgresql: {
        id: 'postgresql',
        name: 'PostgreSQL',
        category: 'database',
        level: 'advanced',
        yearsOfExperience: 3,
        parentSkillId: 'database'
      },
      mongodb: {
        id: 'mongodb',
        name: 'MongoDB',
        category: 'database',
        level: 'intermediate',
        yearsOfExperience: 2,
        parentSkillId: 'database'
      },
      docker: {
        id: 'docker',
        name: 'Docker',
        category: 'devops',
        level: 'intermediate',
        yearsOfExperience: 2,
        subSkills: ['kubernetes']
      }
    };

    this.userGraphs.set(userId, {
      userId,
      nodes,
      updatedAt: new Date().toISOString()
    });
  }

  public getSkillGraph(userId: string): SkillGraph {
    if (!this.userGraphs.has(userId)) {
      this.seedDefaultGraph(userId);
    }
    return this.userGraphs.get(userId)!;
  }

  public calculateCoverage(userId: string, requiredSkills: string[]): {
    coverageScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    skillDepthBonus: number;
  } {
    const graph = this.getSkillGraph(userId);
    const userSkillNames = new Set(
      Object.values(graph.nodes).map(n => n.name.toLowerCase())
    );

    const matched: string[] = [];
    const missing: string[] = [];

    for (const req of requiredSkills) {
      const reqLower = req.toLowerCase();
      if (userSkillNames.has(reqLower)) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    }

    const baseCoverage = requiredSkills.length > 0
      ? (matched.length / requiredSkills.length) * 100
      : 100;

    let expertCount = 0;
    for (const node of Object.values(graph.nodes)) {
      if (node.level === 'expert' || node.level === 'advanced') {
        expertCount++;
      }
    }
    const skillDepthBonus = Math.min(15, expertCount * 3);

    return {
      coverageScore: Math.min(100, Math.round(baseCoverage + skillDepthBonus * 0.2)),
      matchedSkills: matched,
      missingSkills: missing,
      skillDepthBonus
    };
  }

  public addSkillNode(userId: string, node: SkillNode): SkillGraph {
    const graph = this.getSkillGraph(userId);
    graph.nodes[node.id] = node;
    graph.updatedAt = new Date().toISOString();
    return graph;
  }
}
