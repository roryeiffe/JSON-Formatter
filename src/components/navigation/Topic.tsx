import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { TopicType } from "./Module";
import { IDsGenerator } from "../../utils/IDsGenerator";

type TopicProps = {
    closeTopic: () => void,
    addTopicToArray: (topic: TopicType) => void
}
export const Topic:React.FC<TopicProps> = ({closeTopic, addTopicToArray} : TopicProps) => {

    const [currentTopic, setCurreentTopic] = useState<TopicType>({
        id:"",
        title: "",
        description: "",
    })
    // Error handling
    const [errorMessage, setErrorMessage] = useState<string | null> (null);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) : void => {
        event.preventDefault();
        setErrorMessage(null);
        const { name, value } = event.target;
        setCurreentTopic( prev => (
            {...prev, 
            [name]: value
            }));

    }

    const handleSubmit = async (event:any) : Promise<void> => {
        event.preventDefault();

        if(currentTopic.title !== undefined && currentTopic.title !== ""){
            const generatedId = await IDsGenerator(currentTopic.title);
            const updatedTopic = {...currentTopic, id:generatedId};
            addTopicToArray(updatedTopic);
            closeTopic();
        }
        else{
            setErrorMessage("Please enter a topic title");
        }
    }

    return(
        <section className="w-1xl p-5 shadow-2xl rounded-2xl my-5 bg-white">
            <div className="flex justify-between p-2 pl-6">   
                <h3 className="text-2xl">Add Topic</h3>
                <IoMdCloseCircle onClick={closeTopic} className="text-2xl cursor-pointer"></IoMdCloseCircle>
            </div>
            {
                errorMessage && <div className="text-red-500 text-center mt-5">{errorMessage}</div>
            }
            <label htmlFor="title" className="block text-left pl-6 mt-5  text-lg">Topic Title</label>
            <input type="text" name="title"
                className="block ml-5 px-4 py-2 mt-2 border w-[90%]
                border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-blue-500 transition duration-300"
            value = {currentTopic?.title} onChange={handleInputChange}/>

             <label htmlFor="description" className="block text-left pl-6 mt-5 text-lg">Topic Description</label>
             <input type="text" name="description"
                className="block ml-5 px-4 py-2 mt-2 border  w-[90%]
                border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-blue-500 transition duration-300"
            value = {currentTopic?.description} onChange={handleInputChange}/>

            <input type="submit" 
            onClick={handleSubmit}  
            className="w-[70%] block  py-3 px-6 mx-auto my-5 mt-12
                    bg-gradient-to-r from-indigo-600 to-blue-500 
                    text-white font-semibold rounded-lg shadow-lg transform text-center
                    transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl 
                    focus:outline-none focus:ring-2 focus:ring-indigo-300"  value="Add Topic"/>
        </section>
    )
    
        
}