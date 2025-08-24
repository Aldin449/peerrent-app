import { Suspense } from "react";
import MyProfile from "../../../components/MyProfile";
import LoadingComponent from "../../../components/Loader";

const MyProfilePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Moj Profil</h1>
                        <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                            Upravljajte svojim nalogom, predmetima i rezervacijama
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Suspense fallback={<LoadingComponent />}>
                    <MyProfile />
                </Suspense>
            </div>
        </div>
    )
}

export default MyProfilePage;