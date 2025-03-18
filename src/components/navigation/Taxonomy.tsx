import { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { Module, ModuleType } from "./Module";
import React from "react";
import { IoMdAddCircle } from "react-icons/io";
import { IDsGenerator } from "../../utils/IDsGenerator";
import { InputSeparator } from "../InputSeparator";

/*Represenation of Navigation.json */

type TaxonomyType = {
    id: string,
    title: string,
    description: string,
    modules: ModuleType[],
    tags: string[],
    skills: string[],
    exitCriterias: string[]
}

type Props = {
    closeForm: () => void,
}

export const Taxonomy: React.FC<Props> = ({closeForm}:Props) => {

    const [moduleFormDisplay, setModuleFormDisplay] = useState<boolean>(false);
    const [currentTaxonomy, setCurrentTaxonomy] = useState<TaxonomyType>({
        id: '',
        title: '',
        description: '',
        modules: [],
        tags: [],
        skills: [],
        exitCriterias: []
    })

    // Set the current taxonomy data
    const [currentModulesData, setModulesData] = useState<ModuleType[]>([]);
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    const [currentSkills, setCurrentSkills] = useState<string[]>([]);
    const [currentExitCriteria, setCurrentExitCriteria] = useState<string[]>([]);
    // Error handling
    const [errorMessage, setErrorMessage] = useState<string | null> (null);


    const handleInputChanges = (event:any) => {
        event.preventDefault();
        setErrorMessage(null);
        const { name, value } = event.target;
        setCurrentTaxonomy(
            {...currentTaxonomy, 
                [name]: value });
    }

    const AddModuleToArray = (module: ModuleType) : void => {

        setCurrentTaxonomy(prevTaxonomy => ({
            ...prevTaxonomy,
            modules: [...prevTaxonomy.modules, module]
        }))
        setModulesData(prevModules => [...prevModules, module]);
    }

    const updateSkills = (skill: string): void => {
        if(!currentSkills.includes(skill)){
            setCurrentSkills(prev => [...prev, skill]);
            //Update taxonomy
            setCurrentTaxonomy(prevTaxonomy => (
                {...prevTaxonomy, 
                    skills: [...prevTaxonomy.skills, skill]
                }))
        }
    }

    const updateTags = (currentTag : string): void => {
        if(!currentTags.includes(currentTag)){
            setCurrentTags(prev => [...prev, currentTag]);
             //Update taxonomy
            setCurrentTaxonomy(prevTaxonomy => (
                {...prevTaxonomy, 
                    tags: [...prevTaxonomy.tags, currentTag]
                }))
        }
    }

    const updateExitCriteria = (exitCriteria: string): void => {
        if(!currentExitCriteria.includes(exitCriteria)){
            setCurrentExitCriteria(prev => [...prev, exitCriteria]);
               //Update taxonomy
            setCurrentTaxonomy(prevTaxonomy => (
                {...prevTaxonomy, 
                    exitCriterias: [...prevTaxonomy.exitCriterias, exitCriteria]
                }))
        }
    }

    const handleUnitSubmit = async (event:any) :Promise<void> => {
        event.preventDefault();
        if(currentTaxonomy.title == ''){
            setErrorMessage("Unit title cannot be empty");
        }
        else{
            const unitId = await IDsGenerator(currentTaxonomy.title);
            const updatedTaxonomy = {...currentTaxonomy, id: unitId};
    
            const formData = JSON.stringify(updatedTaxonomy, null, 2);
            const blob = new Blob([formData], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; 
            link.download = currentTaxonomy.title + '.json'; 
            link.click();
                URL.revokeObjectURL(url);
        }
      
    }

    const removeMetaDataElement = (
        arrayName: 'tags' | 'exitCriterias' | 'skills' | 'modules',
        indexToRemove: number
    ) : void => {

        setCurrentTaxonomy(prevTaxonomy => ({
            ...prevTaxonomy,
            [arrayName]: prevTaxonomy[arrayName].filter((_, index) => index !== indexToRemove)
        }))
        
        if(arrayName === 'tags'){
            setCurrentTags(prev => prev.filter((_, index) => index!== indexToRemove));
        }
        
        if(arrayName ==='skills'){
            setCurrentSkills(prev => prev.filter((_, index) => index!== indexToRemove));
        }
        
        if(arrayName === 'exitCriterias'){
            setCurrentExitCriteria(prev => prev.filter((_, index) => index!== indexToRemove));
        }
        if(arrayName === 'modules'){
            setModulesData(prev => prev.filter((_, index) => index!== indexToRemove));
        }

    }


    return(
        <>
        <form onSubmit = {handleUnitSubmit} 
        className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex gap-[50px] text-2xl justify-between font-bold">
                <h2>Create a Unit</h2>
                <IoMdCloseCircle className="cursor-pointer" onClick={closeForm}></IoMdCloseCircle>
            </div>
            {
                errorMessage && <p className="text-red-600 text-left mb-4">{errorMessage}</p>
            }
            <label htmlFor="unit_title" className="block text-xl mt-2">Unit Title</label>
            <input type="text" required id="unit_title" 
            
            onChange ={handleInputChanges}   
                className="block px-4 py-2 mt-2 border
                border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-blue-500 transition duration-300" 
                name="title" 
                value={currentTaxonomy.title}/>

            <label htmlFor="unit_description" 
            className="block text-xl mt-2">Unit Description </label>
            
            <input type="text" id="unit_description"  
            className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300"
             onChange ={handleInputChanges} 
             name="description" 
             value={currentTaxonomy.description}/>

             <label className="block text-xl mt-2">Modules</label>
            <button type="button" 
                    onClick={() => setModuleFormDisplay(!moduleFormDisplay)}  
                    className="bg-gray-700 
                    my-5 hover:bg-blue-700 text-white font-bold py-2 px-4 
                    rounded flex items-center">
                    <IoMdAddCircle className="text-amber-50 mr-2"></IoMdAddCircle >
                    <span>Add Module</span></button>
           
            {
               moduleFormDisplay && <Module closeModule={() => setModuleFormDisplay(false) } AddModuleToArray = {AddModuleToArray}></Module>
            }
            <h3 className="text-xl my-5">
                {
                    currentModulesData.length > 0 ? "Selected Modules:": "No modules selected"
                }
            </h3>
            <ul className="space-y-6">
                {currentModulesData.map((module: ModuleType, index: number) => (
                    <div key={index} className="p-6 bg-white flex  justify-between rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300">
                        <li className="space-y-4">
                            <p className="text-xl font-semibold text-indigo-600">{module.title}</p>
                            <p className="text-gray-700">{module.description}</p>
                            <p className="text-lg font-medium text-gray-900">Related Topics:</p>

                            <ul className="pl-6 space-y-2">
                                {module.topics.map((topic, i) => (
                                    <li key={i} className="text-sm text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors duration-200">
                                        {topic.title}
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <IoMdCloseCircle className="cursor-pointer text-2xl" onClick={() => removeMetaDataElement('modules', index)}> </IoMdCloseCircle>
                    </div>
                ))}
            </ul>

            <div>
                <h3  className="text-xl my-3">Skills </h3>
                <InputSeparator insertNewData={updateSkills} removeData={(index) => removeMetaDataElement('skills', index)}></InputSeparator>
            </div>
            <div>
                <h3  className="text-xl my-3">Tags </h3>
                <InputSeparator insertNewData={updateTags} removeData={(index) => removeMetaDataElement('tags', index)}></InputSeparator>
            </div>
            <div>
                <h3  className="text-xl my-3">Exit Criteria</h3>
                <InputSeparator insertNewData={updateExitCriteria} removeData={(index) => removeMetaDataElement('exitCriterias', index)}></InputSeparator>
            </div>
                <a href="#" onClick = {handleUnitSubmit} 
                    className="w-full block mt-3 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
                    text-white font-semibold rounded-lg shadow-lg transform text-center
                    transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl 
                    focus:outline-none focus:ring-2 focus:ring-indigo-300">Generate
                </a>            
        </form>
        </>
    )
}