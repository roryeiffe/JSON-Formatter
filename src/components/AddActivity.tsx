import React, { useState, useEffect, ChangeEvent, FormEvent, act } from "react";
import { Activity, AddActivityProps, ArtifactAttachment } from "../types";

import '../styles/AddActivity.css';
import { IDsGenerator } from "../utils/IDsGenerator";
import ArtifactAttachmentForm from "./form-components/ArtifactAttachmentForm";
import URLAttachmentForm from "./form-components/URLAttachmentForm";
import TagForm from "./form-components/TagForm";
import SkillForm from "./form-components/SkillForm";

const commonPLTTypes = ['ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT0042', 'ACT005', 'ACT0061', 'ACT0062', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'ACT012', 'ACT013']
const commonILTTypes = ['ACT001', 'ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT005', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'Project -> Kick Off']
const commonISTTypes = ['ACT002', 'ACT003', 'ACT004', 'ACT0041', 'ACT0042', 'ACT005', 'ACT0061', 'ACT0062', 'ACT0063', 'ACT007', 'ACT0081', 'ACT0082', 'ACT0083', 'ACT009', 'ACT012', 'ACT013']


function AddActivity({ hierarchyItem, upsertActivityFunc, updateMode, activityProp }: AddActivityProps) {

  const [tags, setTags] = useState<string>('');

  const [activity, setActivity] = useState<Activity>({
    activityId: "",
    activityName: 'Default Activity Name',
    activityPath: './path',
    activityURL: 'http://example.com',
    activityType: 'lecture',
    type: 'ACT0063',
    description: '',
    instruction: '',
    trainerNotes: '',
    duration: 30,
    tags: [],
    skills: [],
    createdAt: new Date(Date.now()),
    isReview: false,
    isOptional: false,
    maxScore: 0,
    githubRepositoryUrl: '',
    vsCodeExtensionUrl: '',
    artifactAttachments: [],
    urlAttachments: [],
    isILT: true,
    isIST: false,
    isPLT: false,
  });

  useEffect(() => {
    if (activityProp) {
      console.log(activityProp)
      setActivity(activityProp);
    }

  }, [activityProp])


  const onChangeHandler = (event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
    setActivity({
      ...activity,
      [event.target.name]: event.target.value
    })
  }

  const onChangeCheckboxHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setActivity({
      ...activity,
      [event.target.name]: event.target.checked
    })
  }

  const onChangeActivityTypeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
    const activityClone = structuredClone(activity);

    if (commonILTTypes.includes(event.target.value)) activityClone.isILT = true;
    if (commonISTTypes.includes(event.target.value)) activityClone.isIST = true;
    if (commonPLTTypes.includes(event.target.value)) activityClone.isPLT = true;

    setActivity({
      ...activityClone,
      type: event.target.value
    })
  }

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(activity.isILT || activity.isIST || activity.isPLT)) {
      alert('Need to choose at least one training format (ILT, IST, PST)')
      return;
    }
    for (const tag of activity.tags) {
      tag.id = await IDsGenerator(tag.name);
    }
    for (const skill of activity.skills) {
      skill.id = await IDsGenerator(skill.name);
    }


    if (!hierarchyItem.hierarchyType) return;
    if (!updateMode) {
      activity.activityId = await IDsGenerator(activity.activityName);
    }
    upsertActivityFunc(activity, hierarchyItem.hierarchyType, hierarchyItem.id);
    setActivity({
      ...activity,
      artifactAttachments: [],
    });

  }

  return (
    <div>
      <form className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-md" onSubmit={(e: FormEvent<HTMLFormElement>) => onSubmitHandler(e)}>
        {hierarchyItem.hierarchyType ? <>
          <div className="gap-[50px] text-2xl font-bold text-center">
            <h2 className="text-3xl">{updateMode ? 'Update' : 'Add'} Activity</h2>
            <h2 className="text-2xl">{hierarchyItem.hierarchyType}</h2>
            <h3>"{hierarchyItem.title}"</h3>
          </div>

          <label htmlFor="activity-name" className="block text-xl mt-2">Activity Name*</label>
          <input required id="activity-name" type="text" className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" name='activityName' value={activity?.activityName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

          <label htmlFor="activity-path" className="block text-xl mt-2">Activity Path*</label>
          <input required id="activity-path" type="text" className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" name='activityPath' value={activity?.activityPath} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

          <label htmlFor="activity-url" className="block text-xl mt-2">Activity URL*</label>
          <input required id="activity-url" type="text" className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" name='activityURL' value={activity?.activityURL} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} />

          <label htmlFor="activity-type" className="block text-xl mt-2">Activity Type*</label>
          <select id='activity-type' className=" border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-white placeholder-gray-500
" onChange={(e) => onChangeActivityTypeHandler(e)} value={activity.type}>
            <option value='ACT001'>Administrative Task</option>
            <option value='ACT002'>Project Evaluation</option>
            <option value='ACT003'>Exam</option>
            <option value='ACT0041'>Audit - Live</option>
            <option value='ACT0042'>Audit - Recorded</option>
            <option value='ACT005'>Practical Challenge</option>
            <option value='ACT0061'>Lesson - Video</option>
            <option value='ACT0062'>Lesson - Learning Content</option>
            <option value='ACT0063'>Lesson - Live Lecture</option>
            <option value='ACT007'>Reference</option>
            <option value='ACT0081'>Lab - Coding Lab</option>
            <option value='ACT0082'>Lab - Coding Challenge</option>
            <option value='ACT0083'>Lab - Mini Project</option>
            <option value='ACT009'>Assignment</option>
            <option value='Project -> Kick Off'>Project - Kick Off</option>
            <option value='Project -> Touchpoint'>Project - Touchpoint</option>
            <option value='Project -> Work Time'>Project - Work Time</option>
            <option value='ACT011'>Review - Mock Interview</option>
            <option value='ACT012'>Review - Self Study</option>
            <option value='ACT013'>Review - Office Hours</option>
          </select>

          <h3 className='block text-xl mt-2'>Applicable Formats (Choose At Least One):</h3>
          <div className='text-2xl flex justify-around'>

            <div>
              <label className='mr-2' htmlFor="isILT">ILT</label>
              <input className='scale-150' id="isILT" checked={activity?.isILT} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeCheckboxHandler(e)} type='checkbox' name='isILT' />
            </div>

            <div>
              <label className='mr-2' htmlFor="isIST">IST</label>
              <input className='scale-150' id="isIST" checked={activity?.isIST} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeCheckboxHandler(e)} type='checkbox' name='isIST' />
            </div>

            <div>
              <label className='mr-2' htmlFor="isPLT">PLT</label>
              <input className='scale-150' id="isPLT" checked={activity?.isPLT} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeCheckboxHandler(e)} type='checkbox' name='isPLT' />
            </div>

          </div>

          <label className="block text-xl mt-2" htmlFor='description'>Description</label>
          <textarea onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e)} value={activity.description} name='description' id='description' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2" htmlFor='trainer-notes'>Trainer Notes</label>
          <textarea onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e)} value={activity.trainerNotes} name='trainerNotes' id='trainer-notes' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2" htmlFor='instruction'>Instruction</label>
          <textarea onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeHandler(e)} value={activity.instruction} name='instruction' id='instruction' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2" htmlFor='duration'>Duration (in minutes)</label>
          <input onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} value={activity.duration} type='number' name='duration' id='duration' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2 text-center" htmlFor='isReview'>Is Review?</label>
          <input className='w-1/1 scale-200' id='isReview' type='checkbox' name='isReview' checked={activity?.isReview} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeCheckboxHandler(e)} />

          <label className="block text-xl mt-2 text-center" htmlFor='isOptional'>Is Optional?</label>
          <input className='w-1/1 scale-200' id='isOptional' type='checkbox' name='isOptional' checked={activity?.isOptional} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeCheckboxHandler(e)} />

          {/* <label className = "block text-xl mt-2 text-center" htmlFor='tags'>Enter tags, separated by commas</label>
          <textarea onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTags(e.target.value)} value={tags} name='tags' id='tags' className="block px-4 py-2 mt-2 border w-1/1"/> */}

          {/* <label className = "block text-xl mt-2 text-center" htmlFor='skills'>Enter skills, separated by commas</label>
          <textarea onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeArrayHandler(e,'skills')} value={activity.skills.map(skill => skill.name).join(',')} name='skills' id='skills' className="block px-4 py-2 mt-2 border w-1/1"/>    */}


          <label className="block text-xl mt-2" htmlFor='github-repository-url'>GitHub Repository URL (If Applicable)</label>
          <input onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} value={activity.githubRepositoryUrl} type='text' name='githubRepositoryUrl' id='github-repository-url' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2" htmlFor='vscode-extension-url'>VS Code Extension URL (If Applicable)</label>
          <input onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} value={activity.vsCodeExtensionUrl} type='text' name='vsCodeExtensionUrl' id='vscode-extension-url' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <label className="block text-xl mt-2" htmlFor='max-score'>Max Score (If Applicable)</label>
          <input onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e)} value={activity.maxScore} type='number' name='maxScore' id='max-score' className="block px-4 py-2 mt-2 border
            border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 
             focus:ring-blue-500 focus:border-blue-500 transition duration-300 w-1/1" />

          <ArtifactAttachmentForm activity={activity} setActivity={setActivity}></ArtifactAttachmentForm>
          <URLAttachmentForm activity={activity} setActivity={setActivity}></URLAttachmentForm>
          <TagForm activity={activity} setActivity={setActivity}></TagForm>
          <SkillForm activity={activity} setActivity={setActivity}></SkillForm>


          <button className="mt-2 m-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 
      text-white font-semibold rounded-lg shadow-lg transform text-center
      transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl mx-auto 
      focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer block" type='submit'>{updateMode ? 'Update' : 'Add'} Activity</button>
        </> :
          <h2>Select a button on the left to access this form</h2>}
      </form>
    </div>
  )

}

export default AddActivity;