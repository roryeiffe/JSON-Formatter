import React, { ChangeEvent, useState } from "react";
import { Tag } from "../../types";

import { TagFormProps } from "../../types";


const TagForm = ({ activity, setActivity }: TagFormProps) => {
  const [tag, setTag] = useState<Tag>({ id: "", name: "" });

  const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setTag({
      ...tag,
      [event.target.name]: event.target.value
    })
  }

  const onAddHandler = (event: any) => {
    event.preventDefault();
    if (tag.name === "") {
      alert("Tag name is required.");
      return;
    }
    if (!activity.tags) return;
    const newTag = { ...tag };
    for (const tagItem of activity.tags) {
      if (tagItem.name === newTag.name) {
        alert("Tag with this name already exists.");
        return;
      }
    }
    setActivity({ ...activity, tags: [...activity.tags, newTag] });
    setTag({ id: "", name: "" });
  }

  const onDeleteHandler = (tagName: string) => {
    setActivity({
      ...activity,
      tags: activity.tags?.filter((tagItem) => tagItem.name !== tagName)
    })
  }


  return (
    <div className="max-w-lg my-7 mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className='text-2xl text-center'>Add Tag</h3>


      <label htmlFor="tag-name" className="block text-xl mt-2">Tag Name*</label>
      <input type="text" name="name" id="tag-name" value={tag.name} onChange={onChangeHandler} className="w-full border border-gray-300 rounded-md p-2" />


      <button type="submit" onClick={onAddHandler} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">Add Tag</button>

      <h3 className='text-2xl text-center mt-4'>Tags</h3>

      <ul className="list-disc pl-5 mt-2">
        {activity.tags?.map((tagItem) => (
          <>
            <li key={tagItem.name} className="text-lg">{tagItem.name}</li>
            <button onClick={() => onDeleteHandler(tagItem.name)} className="text-red-500 ml-2">Delete</button>
          </>

        ))}
      </ul>

    </div>
  )

}

export default TagForm;