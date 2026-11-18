const API_BASE_URL = '/api/v1';

const getErrorMessage = (error, fallback) => {
    if (Array.isArray(error.detail) && error.detail.length > 0) {
        const firstError = error.detail[0];
        const location = firstError.loc?.filter((part) => part !== 'body').join('.');
        return location ? `${location}: ${firstError.msg}` : firstError.msg;
    }
    return typeof error.detail === 'string' ? error.detail : fallback;
};

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
        throw new Error(getErrorMessage(error, 'Failed to create project'));
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

export const updatePlannedDate = async (stepId, updates) => {
    const body = {};
    if (updates.newPlannedDate !== undefined) body.new_planned_date = updates.newPlannedDate;
    if (updates.reason !== undefined) body.reason = updates.reason;
    if (updates.contactEmail !== undefined) body.contact_email = updates.contactEmail;

    const response = await fetch(`${API_BASE_URL}/projects/steps/${stepId}/planned-date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, 'Failed to update step schedule'));
    }
    return response.json();
};

export const addStepMaterial = async (stepId, materialName, plannedDate) => {
    const response = await fetch(`${API_BASE_URL}/projects/steps/${stepId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            material_name: materialName,
            planned_date: plannedDate,
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, 'Failed to add material'));
    }
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