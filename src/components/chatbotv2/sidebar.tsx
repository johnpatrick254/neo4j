"use client"
import {
    LifeBuoy,
    MessageCircleMore,
    PanelLeftIcon,
    PlusIcon,
    Settings2,
    SquareUser,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useContext, useState } from "react"
import { MessagesContext } from "@/context/messages"
import uuid from "react-uuid"

export default function SideBar() {
    const { handleSessionChange, sessions } = useContext(MessagesContext);
    const [mouseOver, setMouseOver] = useState(false);
    return (
        <aside style={{ width: !mouseOver ? "3.5rem" : "15rem" }} onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)} className={`hidden backdrop-blur-md aside inset-y fixed overflow-x-hidden left-0 z-20 md:flex h-full flex-col border-r transition-all duration-200 ease-in-out`}>
            <nav className="grid gap-5 w-full p-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg bg-muted"
                            aria-label="Playground"
                        >
                            <PanelLeftIcon className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                        Menu
                    </TooltipContent>
                </Tooltip>
                <ul className="flex flex-col pl-2 w-full gap-y-3 font-semibold">
                    <li onClick={() => handleSessionChange(null)} className="flex mb-2 cursor-pointer w-15 text-nowrap text-center justify-start items-center gap-x-4 text-sm" >
                        <PlusIcon />
                        <p>New chat</p>
                    </li>
                    {mouseOver && <h3 className="text-sm cursor-pointer" >Recent</h3>}
                    {
                        mouseOver
                        &&
                        <div className="space-y-3 md:max-h-[51vh] xl:max-h-[59vh] z-10 overflow-y-auto">
                            {
                                sessions.map(session => {
                                    return <li key={session.id} onClick={() => handleSessionChange(session)} className="flex cursor-pointer w-15 outline-2 text-nowrap text-left justify-start items-center gap-x-4 text-sm truncate" >
                                        <MessageCircleMore className="h-6 w-6" />
                                        <p className="w-[11rem] truncate font-normal">{session.firstQuery}</p>
                                    </li>
                                })
                            }
                        </div>
                    }
                </ul>
            </nav>
            <nav className="mt-auto grid gap-1 p-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg"
                            aria-label="Settings"
                        >
                            <Settings2 className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                        Settings
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-auto rounded-lg"
                            aria-label="Help"
                        >
                            <LifeBuoy className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                        Help
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-auto rounded-lg"
                            aria-label="Account"
                        >
                            <SquareUser className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                        Account
                    </TooltipContent>
                </Tooltip>
            </nav>
        </aside>
    )
}