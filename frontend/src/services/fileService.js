import api from './api'

export const fileService = {
    upload: (file, metadata = {}) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('metadata', JSON.stringify(metadata))

        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    uploadPhoto: (formData) => {
        return api.post('/files/upload-photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    get: (fileId) => api.get(`/files/${fileId}`),

    getUrl: (fileId) => `/api/files/${fileId}`
}
