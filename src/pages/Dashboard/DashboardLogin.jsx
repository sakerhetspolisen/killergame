import { Button } from "@chakra-ui/button";
import { FormLabel } from "@chakra-ui/form-control";
import { Input, InputGroup } from "@chakra-ui/input";
import { useContext, useState } from "react";
import { Redirect, Link } from "react-router-dom";
import AuthContext from "../../contexts/AuthContext";
import { auth } from "../../utils/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
	const [isAuthenticated, setAuthentication] = useContext(AuthContext);
	const [isButtonDisabled, setButtonState] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [formMessage, setMessage] = useState("");

	async function handleLogin(e) {
		e.preventDefault();
		setButtonState(true);

		const trimmedEmail = email.trim();

		if (trimmedEmail !== "" && password !== "") {
			try {
				await signInWithEmailAndPassword(auth, trimmedEmail, password);
				setAuthentication(true);
				setMessage("You have successfully logged in.");
			} catch (error) {
				let message = "";
				switch (error.code) {
					case "auth/user-not-found":
						message =
							"There is no account associated with this email address.";
						break;
					case "auth/wrong-password":
						message = "Wrong password. Try again.";
						break;
					default:
						message = error.message;
				}
				setButtonState(false);
				setMessage(message);
			}
		}
	}

	if (isAuthenticated === null) return null;
	if (isAuthenticated === true) return <Redirect to="/" />;
	return (
        <div style={{
            display: "flex",
            position: "fixed",
            height: "100%",
            width: "100%",
            left: "0",
            top: "0"
        }}>
            <div style={{margin: "auto", width: 300}}>
                <InputGroup>
                    <FormLabel whiteSpace="nowrap">E-postadress</FormLabel>
                    <Input
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoCapitalize="false"
                        spellCheck="false"
                        focusBorderColor="red.500"
						background="red.900"
						size="lg"
						fontWeight="bold"
						borderWidth="3px"
						borderRadius="3px"
                        autoFocus
                    />
                </InputGroup>
                <InputGroup>
                    <FormLabel whiteSpace="nowrap">Lösenord</FormLabel>
                    <Input 
                        autoComplete="password"
                        focusBorderColor="red.500"
                        background="red.900"
                        size="lg"
                        fontWeight="bold"
                        borderWidth="3px"
                        borderRadius="3px"
                        type="password"
                        onChange={(e) => setPassword(e.target.value)} />
                </InputGroup>
                <p>{formMessage}</p>
                <Button onClick={handleLogin} disabled={isButtonDisabled} colorScheme="red">
                    Logga in
                </Button>
            </div>
        </div>
	);
}
