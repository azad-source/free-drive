import { generateUUID } from "three/src/math/MathUtils.js";
import { sessionFields } from "../config/user.config";

export class EntryForm {
  form: HTMLFormElement;

  constructor() {
    if (!sessionStorage.getItem(sessionFields.playerId)) {
      this.init();
    } else {
      this.deleteUserButton();
    }
  }

  init() {
    this.form = document.createElement("form");
    this.form.style.position = "absolute";
    this.form.style.height = "200px";
    this.form.style.display = "flex";
    this.form.style.flexDirection = "column";
    this.form.style.justifyContent = "center";
    this.form.style.alignItems = "center";
    this.form.style.gap = "10px";
    this.form.style.boxSizing = "border-box";
    this.form.style.top = "50%";
    this.form.style.left = "50%";
    this.form.style.transform = "translate(-50%, -50%)";
    this.form.style.padding = "50px";
    this.form.style.background = "#fff";
    this.form.style.boxShadow = "0 0 5px 2px rgba(0,0,0,0.3)";
    this.form.style.borderRadius = "10px";

    const nameField = document.createElement("input");
    nameField.style.fontSize = "20px";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Create";
    submitButton.type = "submit";
    submitButton.style.fontSize = "20px";
    submitButton.style.width = "100%";

    submitButton.addEventListener("click", (e) => {
      this.submit(e, nameField.value);
    });

    this.form.append(nameField, submitButton);
    document.body.append(this.form);
  }

  submit(e: MouseEvent, playerName: string) {
    sessionStorage.setItem(sessionFields.playerId, generateUUID());
    sessionStorage.setItem(sessionFields.playerName, playerName);
    this.closeForm();
    window.location.reload();
  }

  closeForm() {
    this.form.remove();
  }

  deleteUserButton() {
    const deleteUserBtn = document.createElement("button");
    deleteUserBtn.style.position = "absolute";
    deleteUserBtn.style.right = "0";
    deleteUserBtn.style.top = "0";
    deleteUserBtn.textContent = "Remove user";
    deleteUserBtn.type = "submit";
    deleteUserBtn.style.fontSize = "20px";
    deleteUserBtn.style.width = "150px";

    deleteUserBtn.addEventListener("click", (e) => {
      sessionStorage.removeItem(sessionFields.playerId);
      sessionStorage.removeItem(sessionFields.playerName);
      window.location.reload();
    });

    document.body.append(deleteUserBtn);
  }
}
