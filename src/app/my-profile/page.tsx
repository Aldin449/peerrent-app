import { Suspense } from "react";
import MyProfile from "../../../components/MyProfile";


const MyProfilePage = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Moj Profil</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <MyProfile />
            </Suspense>
        </div>
    )
}

export default MyProfilePage;