import React, {useState} from "react";
import {SkillFormProps} from "../../types";

const SkillForm = ({activity, setActivity}:SkillFormProps) => { 
  const [skill, setSkill] = useState({
    id: "",
    name: ""
  });

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSkill({
      ...skill,
      [event.target.name]: event.target.value
    })
  }

    const onAddHandler = (event: any) => {
        event.preventDefault();
        if(skill.name === "") {
        alert("Skill name is required.");
        return;
        }
        if(!activity.skills) return;
        const newSkill = { ...skill };
        for (const skillItem of activity.skills) {
        if (skillItem.name === newSkill.name) {
            alert("Skill with this name already exists.");
            return;
        }
        }
        setActivity({ ...activity, skills: [...activity.skills, newSkill] });
        setSkill({ id: "", name: "" });
    }

    const onDeleteHandler = (skillName: string) => {
        setActivity({
            ...activity,
            skills: activity.skills?.filter((skillItem) => skillItem.name !== skillName)
        })
    }

    return (
        <div className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h3 className='text-2xl text-center'>Add Skill</h3>


            <label htmlFor="skill-name" className="block text-xl mt-2">Skill Name*</label>
            <input type="text" name="name" id="skill-name" value={skill.name} onChange={onChangeHandler} className="w-full border border-gray-300 rounded-md p-2" />


            <button type="submit" onClick={onAddHandler} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">Add Skill</button>


            <h3 className='text-2xl text-center mt-4'>Skills</h3>


            <ul className="list-disc pl-5 mt-2">
                {activity.skills?.map((skillItem) => (
                    <>
                        <li key={skillItem.name} className="text-lg">{skillItem.name}</li>
                        <button onClick={() => onDeleteHandler(skillItem.name)} className="text-red-500 ml-2">Delete</button>
                    </>
                ))}
            </ul>


        </div>
    )


  }

  export default SkillForm;