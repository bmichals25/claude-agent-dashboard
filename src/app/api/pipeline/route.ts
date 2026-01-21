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
