const API_BASE_URL = '/api/v1';

export const fetchProjects = async () => {
    const response = await fetch(`${API_BASE_URL}/projects/`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
};

export const createProject = async (projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.[0]?.msg || 'Failed to create project');
    }
    return response.json();
};

export const deleteProject = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete project.");
    };
};

export const updatePlannedDate = async (stepId, newPlannedDate, reason) => {
    const response = await fetch(`${API_BASE_URL}/projects/steps/${stepId}/planned-date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            new_planned_date: newPlannedDate,
            reason,
        }),
    });
    if (!response.ok) throw new Error('Failed to update step date');
    return response.json();
};

export const markStepDone = async (stepId, completionRemark) => {
    const response = await fetch(`${API_BASE_URL}/projects/steps/${stepId}/mark-done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_remark: completionRemark || null }),
    });
    if (!response.ok) throw new Error('Failed to mark step as done');
    return response.json();
};

export const markMaterialDone = async (materialId, completionRemark) => {
    const response = await fetch(`${API_BASE_URL}/projects/materials/${materialId}/mark-done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_remark: completionRemark || null }),
    });
    if (!response.ok) throw new Error('Failed to mark material as done');
    return response.json();
};