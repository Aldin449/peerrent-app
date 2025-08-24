import axios, { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

const resetPasswordRequest = async (email: string) => {
    const response = await axios.post(`/api/auth/request-password-reset`, { email })
    return response.data;
}

export const useResetPasswordRequest = ({ onSuccess, onError }: { onSuccess: () => void, onError: () => void }) => {
    return useMutation({
        mutationKey: ['reset-password-request'],
        mutationFn: resetPasswordRequest,
        onSuccess: () => {
            if (onSuccess) {
                return onSuccess();
            }
        },
        onError: () => {
            if (onError) {
                return onError();
            }
        }
    })
}

const resetPassword = async ({ password, confirmPassword, token }: { password: string, confirmPassword: string, token: string }) => {
    const response = await axios.post(`/api/auth/reset-password`, { password, confirmPassword, token });
    return response.data;
}

export const useResetPassword = ({ onSuccess, onError }: { onSuccess: () => void, onError: () => void }) => {
    return useMutation({
        mutationKey: ['reset-password'],
        mutationFn: resetPassword,
        onSuccess: () => {
            if (onSuccess) return onSuccess()
        },
        onError: () => {
            if (onError) return onError()
        }
    })
}

const changePassword = async ({ currentPassword, newPassword, confirmPassword }: { currentPassword: string, newPassword: string, confirmPassword: string }) => {
    const response = await axios.patch(`/api/auth/change-password`, { currentPassword, newPassword, confirmPassword });
    return response.data;
}

export const useChangePassword = ({ onSuccess, onError }: { onSuccess: () => void, onError: (error:any) => void }) => {
    return useMutation({
        mutationKey: ['change-password'],
        mutationFn: changePassword,
        onSuccess: () => {
            if (onSuccess) return onSuccess()
        },
        onError: (error) => {
            if (onError) return onError(error)
        }
    })
}