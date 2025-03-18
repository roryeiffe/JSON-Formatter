import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { Topic } from "./Topic";
import { IoMdAddCircle } from "react-icons/io";
import { IDsGenerator } from "../../utils/IDsGenerator";

export type ModuleType  = {

    id:string,
    title: string,
    description: string,
    topics: TopicType[]
}

export type TopicType  = {

    id:string,
    title: string,
    description: string

}

type Props  ={
    closeModule: () => void,
    AddModuleToArray: (module: ModuleType) => void      
}
export const Module: React.FC<Props> = ({ closeModule, AddModuleToArray } : Props ) => {

    const [currentModule,  setCurrentModule] = useState<ModuleType> ({
        id: '',
        title: '',
        description: '',
        topics: []
    });
    const [displayTopicModule, setdisplayTopicModule] = useState<boolean> (false);
    const [topicsList, setTopicsList] = useState<TopicType[]> ([]);
    const [errorMessage, setErrorMessage] = useState<string | null> (null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) :void => {
        event.preventDefault();
        setErrorMessage(null);

        const { name, value } = event.target;

        setCurrentModule(prev => ({
            ...prev,
            [name]: value
        }));
    }
    
    const updateModule = async (event:any) : Promise<void> => {

        event.preventDefault();
        if(currentModule.title != ""){
            const generatedId = await IDsGenerator(currentModule.title);
            const updatedModule = {...currentModule, id:generatedId};
            AddModuleToArray(updatedModule);
            closeModule();
        }
        else{
            setErrorMessage("Module title can't be null")
        }
    }

    const addTopicToArray = (topic:TopicType) : void => {
    
        setTopicsList( prev => ([...prev, topic]));
        setCurrentModule(prev => ({
            ...prev,
            topics: [...topicsList, topic]
        }));

    }

    const removeTopicFromArray = (i:number) : void => {

        const newTopicsList = currentModule.topics.filter((_, index) => index !== i);
        setCurrentModule((prev) => (
            {
            ...prev,
            topics: newTopicsList
            }
        ))
        setTopicsList(newTopicsList);

    }

    return(
        <section className=" backdrop-blur-lg m-5 p-3 rounded-lg shadow-md">
            <div className="flex justify-between p-2 pl-6">   
                <h3 className="text-2xl">Create a Module</h3>            
                <IoMdCloseCircle 
                onClick={closeModule} 
                className="text-4xl cursor-pointer"></IoMdCloseCircle>
            </div>
            {errorMessage && <p className="text-red-600 text-left ml-6 mb-4">{errorMessage}</p>}
            <label 
            htmlFor="module_title" 
            className="block text-left pl-6 text-lg">Module Title</label>
            <input type="text" 
                value={currentModule?.title || ''} 
                onChange={handleChange}  
                name = "title"  
                id="module_title" 
                className="block ml-5 px-4 py-2 mt-2 border
                border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-blue-500 transition duration-300"/>

            <label 
            htmlFor="module_description" 
            className="block text-left pl-6 text-lg">Module Description </label>
            <input 
                type="text" 
                value={currentModule?.description} 
                onChange={handleChange}  
                name = "description" 
                id="module_description" 
                className="block ml-5 px-4 py-2 mt-2 border
                border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"/>

            <label htmlFor="module_description" 
            className="block text-left pl-6 text-lg ">Topics</label>

            <button type="button"  
                    className="bg-gray-700 ml-6
                    my-5 hover:bg-blue-700 text-white font-bold py-2 px-4 
                    rounded flex items-center"
                    onClick={() => setdisplayTopicModule(true)}>

                    <IoMdAddCircle className="text-amber-50 mr-2"></IoMdAddCircle >
                    <span>Add Topic</span>
                </button>
            {/*Display Topic form*/}
            <div>
                {displayTopicModule && <Topic closeTopic={() => setdisplayTopicModule(false)} addTopicToArray={addTopicToArray}></Topic>}
            </div>
             {/*Display Added Topics*/}
             <p className="text-xl my-5 ml-6">Selected Topics:</p>
             {  topicsList.length < 1 ? <p className="text-md my-2 ml-6">No Topics Selected</p> :
                topicsList.map((topic:TopicType, index:number) => (
                    <div key={index} 
                        className="py-2 px-5 bg-gray-200  text-black mx-1 my-3
                            rounded-md shadow-lg hover:bg-blue-200  cursor-pointer
                            transition-all duration-300 flex items-center gap-2 justify-between">
                        <h4 className="text-xl">{topic.title}</h4>
                        <IoMdCloseCircle 
                        onClick={() => removeTopicFromArray(index)} 
                        className="text-xl"></IoMdCloseCircle>
                    </div>
                ))
             }

            <input type="submit" 
             className="w-[70%] block py-3 px-6 mx-auto my-5 mt-12
             bg-gradient-to-r from-indigo-600 to-blue-500 
             text-white font-semibold rounded-lg shadow-lg transform text-center
             transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl 
             focus:outline-none focus:ring-2 focus:ring-indigo-300"
            onClick = {updateModule}  
            value="Add Module"/>

        </section>

    )
}