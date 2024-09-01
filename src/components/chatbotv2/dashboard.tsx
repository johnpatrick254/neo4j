
import ChatbotMessages from "../chatbot/ChatbotMessages"
import ChatbotInput from "../chatbot/ChatbotInput"
import SideBar from "./sidebar"
export function Dashboard() {
    return (
        <div className="grid h-screen w-full pl-0 md:pl-[56px]">
            <div className="flex flex-col">
                    <SideBar/>
                <main className="flex flex-col justify-center items-center ">
                    <div className="relative flex h-full min-h-[93vh] w-full flex-col rounded-xl p-4 lg:max-w-[750px]">
                        <div className="h-full" >
                            <ChatbotMessages className="pt-2"/>
                        </div>
                        <ChatbotInput/>
                    </div>
                </main>
            </div>
        </div>
    )
}