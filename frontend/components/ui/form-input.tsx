export const FormInput = ({ type, placeholder }: { type: string; placeholder: string }) => {
    return (
        <>
        <label>
            <input required type={type} className="input" />
            <span>{placeholder}</span>
        </label>

        <style jsx>{`
            label {
                position: relative;
            }

            .input {
                width: 100%;
                padding: 10px 10px 20px 10px;
                outline: 0;
                border: 1px solid rgba(105, 105, 105, 0.397);
                border-radius: 10px;
            }

            .input + span {
                position: absolute;
                left: 10px;
                top: 15px;
                color: grey;
                font-size: 0.9em;
                cursor: text;
                transition: 0.3s ease;
            }

            .input:placeholder-shown + span {
                top: 15px;
                font-size: 0.9em;
            }

            .input:focus + span,
            .input:valid + span {
                top: 30px;
                font-size: 0.7em;
                font-weight: 600;
            }

            .input:valid + span {
                color: green;
            }
        `}</style>
        </>
    );
    }
