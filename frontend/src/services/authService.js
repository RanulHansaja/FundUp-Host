

import axios from "axios";

axios.defaults.withCredentials = true; // ← sends cookie with every request

// Response interceptor to handle session expiration globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("userID");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getUniversities = () => {
    return axios.get(`${BASE_URL}/universities/getUniversities.php`);
};

export const getProjects = () => {
    return axios.get(
        `${BASE_URL}/projects/getProjects.php`
    );
};

export const getDonorDashboardData = (params) => {
    return axios.get(
        `${BASE_URL}/donor/getDashboardData.php`, {
        params
    }
    );
};

export const getMyDonations = (params) => {
    return axios.get(
        `${BASE_URL}/donor/getMyDonations.php`, {
        params
    }
    );
};

export const getCompletedDonationsBreakdown = () => {
    return axios.get(`${BASE_URL}/donor/getCompletedDonationsBreakdown.php`);
};

export const getPendingDonations = () => {
    return axios.get(`${BASE_URL}/donor/getPendingDonations.php`);
};

export const getDonationDetails = (donationID) => {
    return axios.get(`${BASE_URL}/donor/getDonationDetails.php`, {
        params: { donationID }
    });
};

export const downloadReceipt = (donationID) => {
    return axios.get(`${BASE_URL}/donor/downloadReceipt.php`, {
        params: { donationID },
        responseType: 'blob' // Important for file downloads
    });
};

export const getPaymentConfirmations = (donorID = 1) => {
    return axios.get(
        `${BASE_URL}/donor/getPaymentConfirmations.php`, {
        params: { donorID }
    }
    );
};

export const registerDonor = (userData) => {
    return axios.post(
        `${BASE_URL}/auth/register.php`,
        userData
    );
};

export const registerOrganizer = (formData) => {
    return axios.post(
        `${BASE_URL}/auth/register.php`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
};

export const createProject = (formData) => {
    return axios.post(
        `${BASE_URL}/organizer/createProject.php`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
};

export const login = (credentials) => {
    return axios.post(
        `${BASE_URL}/auth/login.php`,
        credentials,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const getUserProfile = (userID) => {
    return axios.get(
        `${BASE_URL}/user/getProfile.php`, {
        params: { userID }
    }
    );
};

export const updateUserProfile = (data) => {
    return axios.post(
        `${BASE_URL}/user/updateProfile.php`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const uploadProfilePhoto = (formData) => {
    return axios.post(
        `${BASE_URL}/user/uploadPhoto.php`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
};

export const deleteProfilePhoto = () => {
    return axios.post(`${BASE_URL}/user/deletePhoto.php`);
};

export const getAdminDashboardData = () => {
    return axios.get(
        `${BASE_URL}/admin/getDashboardData.php`
    );
};

export const getOrganizerApprovals = () => {
    return axios.get(
        `${BASE_URL}/admin/getOrganizerApprovals.php`
    );
};

export const getProjectDetails = (projectID) => {
    return axios.get(
        `${BASE_URL}/projects/getProjectDetails.php`, {
        params: { projectID }
    }
    );
};

export const createProgressUpdate = (formData) => {
    return axios.post(`${BASE_URL}/organizer/createProgressUpdate.php`, formData, {
        responseType: 'json'
    });
};


export async function getOrganizerDetails(verificationID) {
    return axios.get(`${BASE_URL}/admin/getOrganizerDetails.php`, {
        params: { verificationID }
    });
}

export async function reviewOrganizer(verificationID, action, remarks = '') {
    return axios.post(`${BASE_URL}/admin/reviewOrganizer.php`, {
        verificationID,
        action,
        remarks
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
}


export const getOrganizerProjects = (userID) => {
    return axios.get(
        `${BASE_URL}/organizer/getOrganizerProjects.php`, {
        params: { userID }
    }
    );
};

export const deleteProject = (projectID, userID) => {
    return axios.post(
        `${BASE_URL}/organizer/deleteProject.php`,
        {
            projectID,
            userID
        }
    );
};

export const updateProject = (projectData) => {
    const isFormData = projectData instanceof FormData;
    return axios.post(
        `${BASE_URL}/organizer/updateProject.php`,
        projectData,
        {
            headers: {
                "Content-Type": isFormData ? "multipart/form-data" : "application/json"
            }
        }
    );
}

export const getOrganizerDashboardData = () => {
    return axios.get(
        `${BASE_URL}/organizer/getDashboardData.php`
    );
};

export const getOrganizerNotifications = () => {
    return axios.get(
        `${BASE_URL}/organizer/getNotifications.php`
    );
};

export const markOrganizerNotificationsRead = () => {
    return axios.post(`${BASE_URL}/organizer/markNotificationsRead.php`);
};

export const getAdminNotifications = () => {
    return axios.get(`${BASE_URL}/admin/getNotifications.php`);
};

export const markAdminNotificationsRead = () => {
    return axios.post(`${BASE_URL}/admin/markNotificationsRead.php`);
};

export const getDonorNotifications = () => {
    return axios.get(`${BASE_URL}/donor/getNotifications.php`);
};

export const markDonorNotificationsRead = () => {
    return axios.post(`${BASE_URL}/donor/markNotificationsRead.php`);
};

export const logout = () => {
    return axios.post(`${BASE_URL}/auth/logout.php`);
};

export const submitComment = (comment) => {
    return axios.post(
        `${BASE_URL}/comments/submitComment.php`,
        { comment },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const getComments = () => {
    return axios.get(`${BASE_URL}/comments/getComments.php`);
};

export const getPayhereParams = (data) => {
    return axios.post(
        `${BASE_URL}/donor/getPayhereParams.php`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const createDonation = (formData) => {
    // If it's a FormData object (from BANK_SLIP upload), set headers accordingly
    const headers = formData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

    return axios.post(
        `${BASE_URL}/donor/createDonation.php`,
        formData,
        { headers }
    );
};

export const getOrganizerDonations = () => {
    return axios.get(
        `${BASE_URL}/organizer/getDonations.php`
    );
};

export const verifyDonation = (data) => {
    return axios.post(
        `${BASE_URL}/organizer/verifyDonation.php`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const reportProject = (data) => {
    return axios.post(
        `${BASE_URL}/projects/reportProject.php`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const getProjectReports = () => {
    return axios.get(`${BASE_URL}/admin/getProjectReports.php`);
};

export const moderateProject = (projectID, action, reason = '') => {
    return axios.post(`${BASE_URL}/admin/moderateProject.php`, {
        projectID,
        action,
        reason
    });
};

export const getProjectDetailsWithReports = (projectID) => {
    return axios.get(`${BASE_URL}/admin/getProjectDetailsWithReports.php`, {
        params: { projectID }
    });
};

export const updateReportStatus = (reportID, status, adminNotes = '') => {
    return axios.post(`${BASE_URL}/admin/updateReportStatus.php`, {
        reportID,
        status,
        adminNotes
    });
};

export const suspendOrganizer = (organizerUserID, reason) => {
    return axios.post(`${BASE_URL}/admin/suspendOrganizer.php`, {
        organizerUserID,
        reason
    });
};

export const getModerationOrganizerDetails = (organizerUserID) => {
    return axios.get(`${BASE_URL}/admin/getModerationOrganizerDetails.php`, {
        params: { organizerUserID }
    });
};

export const getAdminUsers = () => {
    return axios.get(`${BASE_URL}/admin/getUsers.php`);
};

export const updateUserStatus = (userID, status, reason = '') => {
    return axios.post(`${BASE_URL}/admin/updateUserStatus.php`, {
        userID,
        status,
        reason
    });
};

export const deleteUser = (userID, reason = '') => {
    return axios.post(`${BASE_URL}/admin/deleteUser.php`, {
        userID,
        reason
    });
};

export const forgotPassword = (email) => {
    return axios.post(
        `${BASE_URL}/auth/forgot-password.php`,
        { email },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

export const resetPassword = (data) => {
    return axios.post(
        `${BASE_URL}/auth/reset-password.php`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};
