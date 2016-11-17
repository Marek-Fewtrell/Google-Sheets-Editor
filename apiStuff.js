
var SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

var allClientInformation;
var modal;
var modalAction = 'update';

var debugging = true;

//========================== Google Access Code Start ==========================
/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  var authorizeDiv = document.getElementById('authorize-div');
  if (authResult && !authResult.error) {
    // Hide auth UI, then load client library.
    authorizeDiv.style.display = 'none';
    loadSheetsApi();
  } else {
    // Show auth UI, allowing the user to initiate authorization by
    // clicking authorize button.
    authorizeDiv.style.display = 'inline';
  }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
  return false;
}

/**
 * Load Sheets API client library.
 */
function loadSheetsApi() {
  var discoveryUrl =
      'https://sheets.googleapis.com/$discovery/rest?version=v4';
  modal = document.getElementById('myModal');
  gapi.client.load(discoveryUrl).then(getSheet);
}
//========================== Google Access Code End ==========================

/*
 * Function: getSheet
 * Retrieves the sheet and get's the data from it.
 *
*/
function getSheet() {
	setMessage("Loading data, please wait");
  gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:D',
    }).then(function(response) {
      var range = response.result;
      if (range.values.length > 0) {
        allClientInformation = range.values;
        for (var i = 0; i < allClientInformation.length; i++) {
          // Ensure all rows are correct size.
          if (allClientInformation[i].length < 4) {
            for (var j=allClientInformation[i].length; j<4; j++ ) {
              allClientInformation[i].push("");
            }
          }
        }
        populateTable();
      } else {
        appendPre('No data found.');
      }
			setMessage(" ");
  }, function(response) {
    appendPre('Error: ' + response.result.error.message);
  });
}

/*
 * Function: populateTable
 * Ensures the table is empty then populates the table with the data.
 *
*/
function populateTable() {
  // Reference to the table.
  var tableRef = document.getElementById('clientsRows');

  //Clear the table of previous data.
  while (tableRef.rows[0]) {
    tableRef.deleteRow(0);
  }

  allClientInformation.forEach(addTableRow, tableRef);
}

/*
 * Function: addTableRow
 * Creates and adds the table row to the table.
 *
 * Params:
 * currentValue - Array of data for a single client.
 * index - The index of the current element being processed in the array.
 * array - not used.
 * thisArg(not dispalyed) - References the table to modify.
*/
function addTableRow(currentValue, index, array) {
  // Insert a row into the table
  var newRow = this.insertRow(-1);

  //Create a new table cell in the table row for each item.
  for(var i = 0; i < currentValue.length; i++) {
    //Insert a cell into the row
    var newCell = newRow.insertCell(-1);
    //Append a text node to the cell
    var newText = document.createTextNode(currentValue[i]);
    newCell.appendChild(newText);
  }

  //New cell to hold the buttons.
  var newCell = newRow.insertCell(-1);
  createButton(newCell, "Update", prepareModal, index);
  createButton(newCell, "Delete", deleteClientRow, index);
}

/*
 * Function: createButton
 * Creates a button of a certain functionality for a table row.
 *
 * Params:
 * newCell - The table cell to place the button into.
 * buttonName - The value displayed on the button.
 * buttonFunction - The function of the button to do. i.e. Update, Delete
 * buttonValue - This indicates the row of the sheet this table row represents.
*/
function createButton(newCell, buttonName, buttonFunction, buttonValue) {
  var newButton1 = document.createElement("Button");
  newButton1.onclick = buttonFunction;
  newButton1.value = buttonValue;
  var text = document.createTextNode(buttonName);
  newButton1.appendChild(text);
  newCell.appendChild(newButton1);
}

/*
 * Function: prepareModal
 * Prepares the popup modal with the correct information and opens it.
 *
*/
function prepareModal() {
  var clientInformation = allClientInformation[this.value];
  populateModalFields(clientInformation, this.value);
  modalAction = 'update';
  openModal();
}

/*
 * Function: createClientButton
 * Opens a blank modal to create a new client.
 * Button on the page uses this.
*/
function createClientButton() {
  document.getElementById("modalClientName").value = "";
  document.getElementById("modalClientAddress").value = "";
  document.getElementById("modalClientMobile").value = "";
  document.getElementById("modalClientEmail").value = "";

  modalAction = 'create';
  openModal();
}

/*
 * Function: populateModalFields
 * Populates the popup modal fields with the data of a row.
 *
 * Params:
 * clientInformation - array of a single client's information
 * clientNumber - the row number of the client in the sheet.
*/
function populateModalFields(clientInformation, clientNumber) {
  //debuggingText("Populating fields" + clientInformation);
  var CIname = clientInformation[0];
  var CIaddress = clientInformation[1];
  var CImobile = clientInformation[2];
  var CIemail = clientInformation[3];
  var CIrowNum = clientNumber;//clientInformation[4];

  var nameText = document.getElementById("modalClientName");
  var addressText = document.getElementById("modalClientAddress");
  var mobileText = document.getElementById("modalClientMobile");
  var emailText = document.getElementById("modalClientEmail");
  var rowNum = document.getElementById("modalRowNumber");
  var modalUpdateBtn = document.getElementById("modalUpdateBtn");

  nameText.value = CIname;
  addressText.value = CIaddress;
  mobileText.value = CImobile;
  emailText.value = CIemail;
  rowNum.value = CIrowNum;
  modalUpdateBtn.value = CIrowNum;
}

/*
 * Function: createClientRow
 * Creates a new row in the sheets.
 *
*/
function createClientRow() {
	setModalMessage("Creating new client row.");
  gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1",
    valueInputOption: "USER_ENTERED",
    values:
      [
        [
          document.getElementById("modalClientName").value,
          document.getElementById("modalClientAddress").value,
          document.getElementById("modalClientMobile").value,
          document.getElementById("modalClientEmail").value
        ]
      ]
  }).then(function(response) {
    //debuggingText(response);
    closeModal();
    visualFeedback("Successfully created client.", true);
    getSheet();
  }, function(response) {
    visualFeedback("Unsuccessfully created client.", true);
    //debuggingText(response);
  });
}

/*
 * Function: updateClientRow
 * Updates a row in the sheets.
 *
*/
function updateClientRow() {
	setModalMessage("Updating client row.");
  //debuggingText("Updating a row");
  var rowNumber = parseInt(document.getElementById("modalRowNumber").value, 10) + 2;
  var therange = 'Sheet1!A' + rowNumber + ':D' + rowNumber;
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: therange,
    valueInputOption: "USER_ENTERED",
    values:
      [
        [
          document.getElementById("modalClientName").value,
          document.getElementById("modalClientAddress").value,
          document.getElementById("modalClientMobile").value,
          document.getElementById("modalClientEmail").value
        ]
      ],
  }).then(function(response) {
    /*
	Check the repsonse for correct number of updates.
	if (response.result.updatedCells === 4) {}
	*/
    //debuggingText(response);

	//Update the data in the clientInformation array.
    var clientInformation = allClientInformation[rowNumber - 2];
    clientInformation[0] = document.getElementById("modalClientName").value;
    clientInformation[1] = document.getElementById("modalClientAddress").value;
    clientInformation[2] = document.getElementById("modalClientMobile").value;
    clientInformation[3] = document.getElementById("modalClientEmail").value;
	//Repopulate the table to update it.
    populateTable();
    closeModal();
    visualFeedback("Successfully updated client.", true);
  }, function(response) {
    visualFeedback("Unsuccessfully updated client.", false);
    //debuggingText(response);
  });
}

/*
 * Function: deleteClientRow
 * Button action which will delete the selected row.
 *
*/
function deleteClientRow() {
  var rowNumber = parseInt(this.value, 10) + 1;
  var endindex = rowNumber + 1;
  //debuggingText("Deleting row " + rowNumber);
  //debuggingText("endIndex " + endindex);
  gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requests:
      [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: rowNumber,
              endIndex: endindex
            }
          }
        },
        {
          appendDimension: {
            sheetId: 0,
            dimension: "ROWS",
            length: 1
          }
        }
      ],
  }).then(function(response) {
    //debuggingText(response);
    visualFeedback("Successfully deleted client.", true);
    getSheet();
  }, function(response) {
    visualFeedback("Unsuccessfully deleted client.", false);
    //debuggingText(response);
  });
}

/*
 * Function: visualFeedback
 * Creates a simply visual feedback for actions done.
 *
 * Params:
 * message - Text to be placed in pre element.
 * status - Success is true.
 */
function visualFeedback(message, status) {
  var vfelement = document.getElementById("visualFeedback");
  vfelement.innerHTML = message;
  if (status) {
    vfelement.className = "visualFeedbackSuccess";
    setTimeout(function() {
      vfelement.className += " visualFeedbackDisappear";
    }, 5000);
  } else {
    vfelement.className = "visualFeedbackFailure";
  }
}

/*
 * Function: setMessage
 * Set the message to be displayed to the user
 *
 * Params:
 * message - message to be displayed.
 */
function setMessage(message) {
  var span = document.getElementById('statusMessages');
  span.innerText = message;
}

/*
 * Function: setModalMessage
 * Set the message to be displayed to the user in the modal
 *
 * Params:
 * message - message to be displayed.
 */
function setModalMessage(message) {
  var span = document.getElementById('modalStatusMessages');
  span.innerText = message;
}

/*
 * Function: debuggingText
 * Deubgging text output.
 *
 * Params:
 * output - Text to be outputted.
*/
function debuggingText(output) {
  if (debugging) {
    console.log("---- Debugging Output ----");
    console.log(output);
  }
}

/*
 * Function: openModal
 * Opens the modal. Different buttons for different modes.
 *
*/
function openModal() {
	setModalMessage("");
  if (modalAction === 'create') {
    document.getElementById("modalUpdateBtn").style.display = "none";
    document.getElementById("modalCreateBtn").style.display = "inline";
  } else if (modalAction === 'update') {
    document.getElementById("modalUpdateBtn").style.display = "inline";
    document.getElementById("modalCreateBtn").style.display = "none";
  }
    modal.style.display = "block";
}

/*
 * Function: closeModal
 * Closes the modal.
 *
*/
function closeModal() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}
