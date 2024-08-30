import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function WithToolTip({component,text}:{component:React.ReactNode,text:string}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {component}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
