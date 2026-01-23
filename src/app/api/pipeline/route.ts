import { NextResponse } from 'next/server';
import { STAGES, PipelineProject } from '@/lib/types';

const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
const PIPELINE_DB = process.env.PIPELINE_DB || '';

function getStageIndex(stageName: string): number {
  const index = STAGES.findIndex(s => s.name === stageName);
  return index >= 0 ? index : 0;
}

function parseProject(page: any): PipelineProject {
  const props = page.properties || {};

  const titleProp = props.Project?.title || [];
  const title = titleProp[0]?.plain_text || 'Untitled';

  const stageProp = props.Stage?.select;
  const stage = stageProp?.name || '1. Intake';

  const statusProp = props.Status?.select;
  const status = statusProp?.name || 'Not Started';

  const progress = props.Progress?.number || 0;

  const priorityProp = props.Priority?.select;
  const priority = priorityProp?.name || 'Medium';

  const agentProp = props['Assigned Agent']?.select;
  const agent = agentProp?.name || 'Unassigned';

  const blockersProp = props.Blockers?.rich_text || [];
  const blockers = blockersProp[0]?.plain_text || '';

  const githubUrl = props['GitHub Repo']?.url || '';
  const deployUrl = props['Deploy URL']?.url || '';

  const notesProp = props.Notes?.rich_text || [];
  const notes = notesProp[0]?.plain_text || '';

  const isActive = props.Active?.checkbox || false;

  // Parse deliverables
  const deliverables = {
    intake: props['Intake Brief']?.url || null,
    research: props['Research Report']?.url || null,
    spec: props['Product Spec']?.url || null,
    architecture: props['Architecture Doc']?.url || null,
    design: props['Design Assets']?.url || null,
    codebase: props['Codebase']?.url || null,
    testReport: props['Test Report']?.url || null,
    securityReport: props['Security Report']?.url || null,
    documentation: props['Documentation']?.url || null,
  };

  return {
    id: page.id,
    title,
    stage,
    stageIndex: getStageIndex(stage),
    status: status as PipelineProject['status'],
    progress,
    priority: priority as PipelineProject['priority'],
    agent,
    blockers,
    githubUrl,
    deployUrl,
    notes,
    url: page.url || '',
    isActive,
    deliverables,
  };
}

export async function GET() {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${PIPELINE_DB}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          sorts: [
            { property: 'Progress', direction: 'descending' }
          ]
        }),
        next: { revalidate: 10 },
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    const projects = data.results.map(parseProject);

    // Sort: active projects first, then by progress
    projects.sort((a: PipelineProject, b: PipelineProject) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.progress - a.progress;
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, priority = 'Medium', stage = '1. Intake' } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!NOTION_TOKEN || !PIPELINE_DB) {
      return NextResponse.json(
        { error: 'Notion not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: PIPELINE_DB },
        properties: {
          Project: {
            title: [{ text: { content: title } }]
          },
          Stage: {
            select: { name: stage }
          },
          Status: {
            select: { name: 'Not Started' }
          },
          Priority: {
            select: { name: priority }
          },
          Progress: {
            number: 0
          },
          Active: {
            checkbox: true
          }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Notion API error: ${response.status}`);
    }

    const page = await response.json();
    const project = parseProject(page);

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const project = await request.json();
    const { id, title, stage, status, progress, priority, agent, blockers, githubUrl, deployUrl, notes, deliverables } = project;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!NOTION_TOKEN) {
      return NextResponse.json(
        { error: 'Notion not configured' },
        { status: 500 }
      );
    }

    // Build properties object for Notion update
    const properties: Record<string, unknown> = {};

    if (title) {
      properties.Project = {
        title: [{ text: { content: title } }]
      };
    }

    if (stage) {
      properties.Stage = {
        select: { name: stage }
      };
    }

    if (status) {
      properties.Status = {
        select: { name: status }
      };
    }

    if (typeof progress === 'number') {
      properties.Progress = {
        number: progress
      };
    }

    if (priority) {
      properties.Priority = {
        select: { name: priority }
      };
    }

    if (agent) {
      properties['Assigned Agent'] = {
        select: { name: agent }
      };
    }

    if (typeof blockers === 'string') {
      properties.Blockers = {
        rich_text: blockers ? [{ text: { content: blockers } }] : []
      };
    }

    if (typeof githubUrl === 'string') {
      properties['GitHub Repo'] = {
        url: githubUrl || null
      };
    }

    if (typeof deployUrl === 'string') {
      properties['Deploy URL'] = {
        url: deployUrl || null
      };
    }

    if (typeof notes === 'string') {
      properties.Notes = {
        rich_text: notes ? [{ text: { content: notes } }] : []
      };
    }

    // Update deliverables
    if (deliverables) {
      if (typeof deliverables.intake === 'string') {
        properties['Intake Brief'] = { url: deliverables.intake || null };
      }
      if (typeof deliverables.research === 'string') {
        properties['Research Report'] = { url: deliverables.research || null };
      }
      if (typeof deliverables.spec === 'string') {
        properties['Product Spec'] = { url: deliverables.spec || null };
      }
      if (typeof deliverables.architecture === 'string') {
        properties['Architecture Doc'] = { url: deliverables.architecture || null };
      }
      if (typeof deliverables.design === 'string') {
        properties['Design Assets'] = { url: deliverables.design || null };
      }
      if (typeof deliverables.codebase === 'string') {
        properties['Codebase'] = { url: deliverables.codebase || null };
      }
      if (typeof deliverables.testReport === 'string') {
        properties['Test Report'] = { url: deliverables.testReport || null };
      }
      if (typeof deliverables.securityReport === 'string') {
        properties['Security Report'] = { url: deliverables.securityReport || null };
      }
      if (typeof deliverables.documentation === 'string') {
        properties['Documentation'] = { url: deliverables.documentation || null };
      }
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Notion API error: ${response.status}`);
    }

    const page = await response.json();
    const updatedProject = parseProject(page);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
