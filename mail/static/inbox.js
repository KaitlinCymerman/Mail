document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Submit email composition form
  document.querySelector('#compose-form').addEventListener('submit', event => {
    event.preventDefault();
    send_email();
  });
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-entire').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-entire').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><div id="emails"><div>`;

  // Get the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // List all the emails in mailbox
    const emailsDiv = document.querySelector('#emails')
    emails.forEach(email => {
      div = document.createElement('div');
      backgroundColor = email.read ? 'bg-light' : 'bg-white';
      div.innerHTML = `
        <span class="sender col-3"> <b>${email.sender}</b> </span>
        <span class="subject col-6"> ${email.subject} </span>
        <span class="timestamp col-3"> ${email.timestamp} </span>
      `;
      div.style.border = '1px solid lightgrey';
      div.style.display= 'block';
      div.classList.add('d-flex', 'p-2', backgroundColor);
      div.addEventListener('click', () => print_email(email, mailbox));
      emailsDiv.append(div);
    });
  })
}

function send_email() {

  // user fetch to send mail
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
  })
  load_mailbox('sent');
}


function print_email(email, mailbox) {

  const email_view = document.querySelector('#email-entire');

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-entire').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // fetch to view mail
  fetch(`/emails/${email.id}`)
  .then(response => response.json())
  .then(email => {
    // View the contents of the email
    email_view.innerHTML = `
    <div><b>From:</b> ${email.sender}<div>
    <div><b>To:</b> ${email.recipients}<div>
    <div><b>Subject:</b> ${email.subject}<div>
    <div><b>Timestamp:</b> ${email.timestamp}<div>
    <button class="btn btn-sm btn-outline-primary" id="reply_email" onclick="reply('${email.id}');">Reply</button>
    <button class="btn btn-sm btn-outline-primary" id="archive" onclick="archive_email(${email.id}, ${email.archived});">${email["archived"] ? "Unarchive" : "Archive"}</button>
    <hr>
    <div>${email.body}</div>
  `;

    // Mark the email as read
    if (mailbox === 'inbox') {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
  })
  .catch(error => {
    console.log('Error:', error);
  });
}


function reply(id) {
  // Users are able to reply to emails.. show the pre-fill composition
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    compose_email();
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = email["subject"].slice(0,2)==="Re: " ? email["subject"] : "Re: " + email["subject"] ;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  })
  .catch(error => {
    console.log(error)
  });
}


function archive_email(id, archived) {
  // Change archived state
  const email_state = !archived
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: email_state
    })
  })
  load_mailbox('inbox');
}
