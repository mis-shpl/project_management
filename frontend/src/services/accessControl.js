// Keeping email groups and permissions in a dedicated config/service file
// makes it easy to add or move users later without touching UI components.

export const ACCESS_GROUPS = {
    ADMININSTRATORS: {
        emails: [
            "",
            "sanjaykumar.530@shpl.com",
            "pradeep.39@shpl.com",
            "vaidehi.5059@shpl.com",
            "sonali.5060@shpl.com",
            "aditya.5071@shpl.com",
            "sandesh.5082@shpl.com",
        ],
        permissions: {
            canViewDashboard: true,
            canViewCreateProject: true,
            canViewPCDashboard: true,
        },
    },
    PROJECT_MANAGEMENT: {
        emails: [
            "dilip.746@shpl.com",
            "mangesh.524@shpl.com",
            "shrinivas.5027@shpl.com",
        ],
        permissions: {
            canViewDashboard: true,
            canViewCreateProject: true,
            canViewPCDashboard: false,
        },
    },
    PROCESS_COORDINATORS: {
        emails: [
            "priyanka.5080@shpl.com",
            "sayali.5067@shpl.com",
            "shubhangi.5073@shpl.com",
        ],
        permissions: {
            canViewDashboard: false,
            canViewCreateProject: false,
            canViewPCDashboard: true,
        },
    },
};

export function getUserAccess(rawEmail) {
    if (!rawEmail) {
        return { isAuthorized: false, email: null, permissions: {} };
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();

    for (const group of Object.values(ACCESS_GROUPS)) {
        if (group.emails.includes(normalizedEmail)) {
            return {
                isAuthorized: true,
                email: normalizedEmail,
                permissions: group.permissions,
            };
        }
    }

    return {
        isAuthorized: false,
        email: normalizedEmail,
        permissions: {},
    };
}

