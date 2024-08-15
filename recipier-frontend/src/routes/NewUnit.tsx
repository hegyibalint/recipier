import { UnitType } from '../model.ts'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'

interface NewUnit {
    type: UnitType
    name: String
    abbreviation: String
    description?: String
}

export default function NewUnit() {
    // Mutation for submitting the form
    const createUnit = useMutation<any, any, NewUnit>({
        mutationFn: async (unit) => {
            const request = await fetch('/api/units', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(unit),
            })
            return await request.json()
        },
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<NewUnit>()

    function onSubmit(data: NewUnit) {
        console.log(data)
        createUnit.mutate(data)
    }

    return (
        <slot>
            <h1>New Unit!</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input {...register('name')} />
                <input {...register('abbreviation')} />
                <select {...register('type')}>
                    <option value="VOLUME">Volume</option>
                    <option value="WEIGHT">Weight</option>
                    <option value="QUANTITY">Quantity</option>
                </select>
                <textarea {...register('description')} />
                <button type="submit">Submit</button>
            </form>
        </slot>
    )
}
