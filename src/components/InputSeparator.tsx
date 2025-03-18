import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";

type Props = {

    insertNewData: (input:string) => void;
    removeData: (index: number) => void;
}


export const InputSeparator: React.FC<Props>  = ({insertNewData, removeData}) => {

    const [currentInputList, setCurrentInputList] = useState<string[]>([]);
    const [currentInput, setCurrentInput] = useState<string>();

    const handleKeyDown = (event) => {
        if(event.key === 'Enter' && currentInput != null && currentInput != undefined){
            setCurrentInputList(prev => [...prev, currentInput]);
            insertNewData(currentInput);
            setCurrentInput('');
        }
    }

    const RemoveInput = (index:number) => {
        setCurrentInputList(prev => [...prev.slice(0, index),...prev.slice(index + 1)]);
        removeData(index);
    }

    return(
        <div>
            <input type="text" placeholder="Enter a new value..."  
                onKeyDown={handleKeyDown}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                value = {currentInput} 
                onChange={(e) => setCurrentInput(e.target.value)}/>
            <div className=" my-5 flex">
                {
                    currentInputList && (
                        currentInputList.map((item, index) => (
                            <div key={index} 
                            className="py-2 px-5 bg-blue-300  text-black mx-1 rounded-md shadow-lg hover:bg-blue-500  cursor-pointer
                            transition-all duration-300 flex items-center gap-3">
                                {item}
                                <span onClick={() => RemoveInput(index)}><IoMdCloseCircle></IoMdCloseCircle>
                                </span>
                            </div>
                        ))
                    )
                }
            </div>
        </div>
        
    )
}
