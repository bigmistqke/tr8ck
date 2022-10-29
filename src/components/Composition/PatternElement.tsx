import { actions, store } from "../../Store"
import { ButtonWithHoverOutline } from "../UIElements"
import zeptoid from "zeptoid"

export default (props: {patternId: string, index: number}) => {

  const dragEnd = () => actions.setDragging("composition", undefined)



  return (
    <div 
      draggable={true} 
      ondragend={dragEnd}
      ondragstart={(e) => 
        actions.setDragging("composition", {
          type: "pattern", 
          patternId: props.patternId,
          id: zeptoid()
        })
      }
      ondblclick={()=>actions.setSelectedPatternId(props.patternId)}
      class="flex mb-2 rounded-xl translate-x-0"
    >
      <ButtonWithHoverOutline 
        class="cursor-pointer w-full flex-1"
        style={{
            background: actions.getPatternColor(props.patternId) || "",
        }}
      >#{props.index} </ButtonWithHoverOutline>
    </div>
  )
}