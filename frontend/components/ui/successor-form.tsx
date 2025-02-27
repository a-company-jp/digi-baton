import React from "react";
import { FormInput } from "./form-input";
import { Form } from "./form";


export const SuccessorForm = ({ goBack }: { goBack: () => void }) => {

    const inputs = [
        <FormInput type="email" placeholder="Email" />,
        <FormInput type="password" placeholder="Password" />,
        <FormInput type="password" placeholder="Confirm password" />
    ]

    return (
        <>
            <Form message="Add a new successor" inputs={inputs} goBack={goBack} />
        </>
    )

}


