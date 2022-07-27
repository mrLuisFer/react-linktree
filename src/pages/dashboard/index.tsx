import { unstable_getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps, NextPage } from 'next'
import Header from '~/components/Header'
import prisma from '~/lib/prisma'
import { HiPlus } from 'react-icons/hi'
import { MouseEvent, useState } from 'react'
import { AiOutlineClear } from 'react-icons/ai'
import axios from 'axios'
import FieldItem from '~/components/dashboard/FieldItem'
import { v4 as uuid } from 'uuid'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false
      }
    }
  }

  const userEmail: string = session!.user!.email!
  const data = await prisma.user.findUnique({
    where: {
      email: userEmail
    }
  })

  if (!data) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false
      }
    }
  }

  return { props: {} }
}

interface Field {
  username: string
  url: string
  description: string
  clientId: string
}

type Icon = '' | 'github' | 'facebook'
const iconsArr: Icon[] = ['github', 'facebook']

const Dashboard: NextPage = () => {
  const [fields, setFields] = useState<Field[]>([])
  const [username, setUsername] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [icon, setIcon] = useState<Icon>('')

  const [isNameError, setIsNameError] = useState<boolean>(false)
  const [isUrlError, setIsUrlError] = useState<boolean>(false)
  const [isDescError, setIsDescError] = useState<boolean>(false)

  const { data } = useSession()

  const inputStyles: string =
    'py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-900 transition-all opacity-80 focus:opacity-100 focus:shadow-sm'
  const labelStyles: string = 'flex flex-col'
  const commonFieldActionStyle: string =
    'bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex justify-center items-center gap-1 text-lg px-3 py-2 transition-all rounded-lg transform active:scale-95 select-none hover:shadow-sm dark:hover:brightness-[1.1]'
  const errorInputHelperStyles: string = 'text-red-500 hover:text-red-600 text-sm mt-1 inline w-fit'

  const clearFields = () => {
    setUsername('')
    setUrl('')
    setDescription('')
    setIcon('')
  }

  const isValidInputs = (): boolean => {
    const isValid: boolean = username.length > 5 && url.length > 5 && description.length > 10
    return isValid
  }

  const handleAddClientFields = async () => {
    if (isValidInputs()) {
      setIsNameError(false)
      setIsUrlError(false)
      setIsDescError(false)
      setFields((prevFields) => [...prevFields, { clientId: uuid(), username, url, description }])
    }

    setIsNameError(true)
    setIsUrlError(true)
    setIsDescError(true)
    clearFields()
  }

  const handleSendData = async () => {
    const res = await axios.post(
      '/api/links',
      JSON.stringify({
        data: fields,
        email: data!.user!.email!
      })
    )
    console.log(res)
  }

  const handleSubmitFields = (e: any) => {
    e.preventDefault()
    console.log(fields)
    handleSendData()
  }

  const handleDeleteField = (id: string) => {
    const newFields = fields.filter((task) => task.clientId !== id)
    setFields(newFields)
  }

  const handleEditField = (id: string) => {
    console.log(id)
  }

  if (!data) {
    return <div>Not session</div>
  }

  return (
    <section className='pt-1 pb-6 px-28 bg-gray-100 dark:bg-gray-800 min-h-screen'>
      <Header username={data!.user!.name!} />
      <section className='dark:text-white flex flex-row-reverse justify-between gap-x-10'>
        <div className='w-full'>
          <div
            className={
              fields.length
                ? 'py-2 px-2 bg-slate-200 dark:bg-slate-900 rounded-xl transition-all shadow-sm hover:shadow-md mb-10'
                : ''
            }
          >
            {fields.length ? (
              fields.map((field) => (
                <FieldItem
                  key={field.url}
                  id={field.clientId}
                  username={field.username}
                  url={field.url}
                  description={field.description}
                  editFunc={() => handleEditField(field.clientId)}
                  deleteFunc={() => handleDeleteField(field.clientId)}
                />
              ))
            ) : (
              <div className='flex justify-center'>
                <p className='text-xl mt-4 select-none'>No links added...</p>
              </div>
            )}
          </div>
        </div>
        <div className='flex justify-center'>
          <form method='POST' className='flex flex-col gap-4' onSubmit={(e) => handleSubmitFields(e)}>
            <div className='flex items-center gap-4'>
              <label htmlFor='username' className={labelStyles}>
                Username:
                <input
                  type='text'
                  name='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  id='username'
                  placeholder='username'
                  className={inputStyles}
                />
                {isNameError && <p className={errorInputHelperStyles}>Error</p>}
              </label>
              <label htmlFor='url' className={labelStyles}>
                Url:
                <input
                  type='text'
                  name='url'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  id='url'
                  placeholder='url'
                  className={inputStyles}
                />
                {isUrlError && <p className={errorInputHelperStyles}>Error</p>}
              </label>
            </div>
            <label htmlFor='description' className={labelStyles}>
              Description
              <textarea
                placeholder='description'
                name='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id='description'
                className={`${inputStyles} h-40 resize-none`}
              />
              {isDescError && <p className={errorInputHelperStyles}>Error</p>}
            </label>
            <label htmlFor='icons'>
              <span className='text-sm block'>Select an Icon:</span>
              <select name='icons' id='icons' className={`${inputStyles} w-40`}>
                {iconsArr.map((icon: Icon) => (
                  <option className='' key={uuid()} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </label>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <button className={commonFieldActionStyle} onClick={handleAddClientFields}>
                  <HiPlus />
                  Add one
                </button>
                <button
                  type='button'
                  className={commonFieldActionStyle}
                  title='Clear inputs'
                  onClick={() => clearFields()}
                >
                  <AiOutlineClear />
                  Clear
                </button>
              </div>
              <button
                type='submit'
                className='py-3 px-8 rounded-md bg-gradient-to-tr transition-all from-blue-700 to-blue-600 w-fit text-base font-medium transform active:scale-95 text-white select-none hover:brightness-[1.2]'
              >
                Save All
              </button>
            </div>
          </form>
        </div>
      </section>
    </section>
  )
}

export default Dashboard
