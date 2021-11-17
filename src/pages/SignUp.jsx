import React, { useState } from "react";
import styles from "./Login.module.css";
import {
	Input,
	Button,
	FormControl,
	FormLabel,
	InputRightAddon,
	InputGroup,
	Checkbox,
	Alert,
	AlertIcon,
	AlertTitle,
	AlertDescription,
	CloseButton
} from "@chakra-ui/react";
import InputMask from "react-input-mask";
import { ref, get, update, set } from "firebase/database";
import dbSearch from "../utils/dbSearch";

/**
 * Sign Up Page that enables user to register for the game.
 * @author Karl Sellergren
 * 
 * 
 * @param db reference to the database
 * 
 */

const SignUp = ({ db }) => {
	const [email, setEmail] = useState("");
	const [fname, setFName] = useState("");
	const [lname, setLName] = useState("");
	const [grade, setGrade] = useState("");
	const [closed, setClosed] = useState(true);
	const [alert, setAlert] = useState({
		visible: true,
		title: "Anmälan är stängd",
		desc: "Ses nästa år!",
		status: "error"
	});

	const generateId = async () => {
		let counter = 0
		while (true) {
			let id = Math.floor(100000 + Math.random() * 900000).toString();
			let exists = await dbSearch("users", "userId", id, 1, "userId");
			if (!exists) {
				return id;
			}
			counter++;
			if (counter === 5) {
				console.alert("Couldn't generate userId")
				setAlert({
					visible: true,
					title: "Det uppstod ett fel.",
					desc: "Var vänlig försök igen.",
					status: "error"
				})
				break
			}
		}
	};

	const updateStats = async (grade) => {
		const updates = {};
		updates["/standings/playersLeft"] = await get(
			ref(db, "/standings/playersLeft")
		).then((data) => {
			return data.val() ? data.val() + 1 : 1;
		});
		updates["/standings/leftFromGrades/" + grade] = await get(
			ref(db, "/standings/leftFromGrades/" + grade)
		).then((data) => {
			return data.val() ? data.val() + 1 : 1;
		})
		.catch((error) => {
			console.alert(error)
			return setAlert({
				visible: true,
				title: "Det uppstod ett fel.",
				desc: "Var vänlig försök igen.",
				status: "error"
			})
		})
		return await update(ref(db), updates);
	};

	const createUser = async (fname, lname, grade, email) => {
		const exists = await dbSearch("users", "email", email, 1, "userId");

		if (!exists) {
			const id = await generateId();
			const millis = Date.now();
			let targetHasNoTarget = false;
			let updates = {};
			const newTarget = await dbSearch(
				"users",
				"assigned",
				false,
				1
			);
			if (newTarget) {
				console.log(newTarget.targetId)
				if (!newTarget.targetId) {
					targetHasNoTarget = true
					updates["/users/" + newTarget.userId + "/targetId"] = id;
				}
			}
			await set(ref(db, "users/" + id), {
				userId: id,
				targetId: newTarget ? newTarget.userId : null,
				fname: fname,
				lname: lname,
				grade: grade,
				email: email.replace(".pch@procivitas.se", ""),
				kills: 0,
				latestTime: millis,
				fastestKill: "",
				assigned: targetHasNoTarget ? true : false,
			})
				.then(() => {
					if (newTarget) {
						updates["/users/" + newTarget.userId + "/assigned"] = true;
					}
					update(ref(db), updates).then(() => {
						updateStats(grade);
						setAlert({
							visible: true,
							title: "Nu är du anmäld!",
							desc: "Du hittar snart din kod i din inkorg.",
							status: "success"
						})
						localStorage.setItem("userId", id);
					});
				})
				.catch((error) => {
					console.alert(error);
					return setAlert({
						visible: true,
						title: "Det uppstod ett fel.",
						desc: "Var vänlig försök igen.",
						status: "error"
					})
				});
		} else {
			return setAlert({
				visible: true,
				title: "Du är redan anmäld.",
				desc: "",
				status: "error"
			});
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!fname | !lname | !grade | !email) {
			return setAlert({
				visible: true,
				title: "Du har inte fyllt i alla fält.",
				desc: "Försök igen.",
				status: "error"
			})
		}
		if (!closed) {
			createUser(
				fname.replace(/^\w/, (c) => c.toUpperCase()),
				lname.replace(/^\w/, (c) => c.toUpperCase()),
				grade.toUpperCase(),
				email + ".pch@procivitas.se"
			);
		}
	};

	return (
		<div className={styles.hero}>
			<div style={{ margin: "auto", padding: 20 }}>
				<h1 style={{ textAlign: "center", fontSize: "2em" }}>
					Anmäl dig till Killergaame...
				</h1>
				<Alert status={alert.status} display={alert.visible ? "flex" : "none"} colorScheme={(alert.status === "error" ? "red.500" : "green.500")} marginTop="3">
					<AlertIcon />
					<AlertTitle mr={2}>{alert.title}</AlertTitle>
					<AlertDescription>{alert.desc}</AlertDescription>
					<CloseButton position="absolute" right="8px" top="8px" onClick={() => setAlert({...alert, visible: false})} />
				</Alert>
				<InputGroup>
					<FormControl id="fname" marginRight="4" marginTop="4">
						<FormLabel>Förnamn</FormLabel>
						<Input
							borderColor="red.500"
							focusBorderColor="red.500"
							background="red.900"
							borderWidth="2px"
							placeholder="Karl"
							borderRadius="0"
							disabled={closed}
							onChange={(e) => setFName(e.target.value)}
						/>
					</FormControl>
					<FormControl id="lname" marginTop="4">
						<FormLabel>Efternamn</FormLabel>
						<Input
							borderColor="red.500"
							focusBorderColor="red.500"
							background="red.900"
							borderWidth="2px"
							placeholder="Sellergren"
							borderRadius="0"
							disabled={closed}
							onChange={(e) => setLName(e.target.value)}
						/>
					</FormControl>
				</InputGroup>
				<FormControl id="email" marginTop="4" marginRight="4">
					<FormLabel>Skolmejl</FormLabel>
					<InputGroup>
						<Input
							borderColor="red.500"
							focusBorderColor="red.500"
							background="red.900"
							borderWidth="2px"
							placeholder="kase"
							borderRadius="0"
							disabled={closed}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<InputRightAddon
							children=".pch@procivitas.se"
							background="red.500"
							borderColor="red.500"
							borderRadius="0"
							borderWidth="3px"
						/>
					</InputGroup>
				</FormControl>
				<FormControl id="class" marginTop="4">
					<FormLabel>Klass</FormLabel>
					<InputGroup>
						<Input
							as={InputMask}
							mask="aa9a"
							maskChar={null}
							borderColor="red.500"
							textTransform="uppercase"
							focusBorderColor="red.500"
							background="red.900"
							borderWidth="2px"
							placeholder="NA2B"
							disabled={closed}
							borderRadius="0"
							onChange={(e) => setGrade(e.target.value)}
						/>
					</InputGroup>
				</FormControl>
				<Checkbox colorScheme="red" marginTop="3" disabled={closed}>
					Blir du någonsin rädd när lamporna är släckta på natten och
					du är ensam hemma?
				</Checkbox>
				<Button
					colorScheme="red"
					isFullWidth={true}
					borderRadius="0"
					disabled={closed}
					marginTop="3"
					onClick={() => handleSubmit}
				>
					Anmäl dig
				</Button>
			</div>
		</div>
	);
};

export default SignUp;
