import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PROTOCOL = 'https:';
const WEBSOCKET_PROTOCOL = 'wss:';
const HOST_AND_PORT = '//localhost:3001';

const Chat = () => {
  const [name, setName] = useState('');
  const [nameok, setNameok] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create a new WebSocket instance and establish a connection
    const newSocket = new WebSocket(WEBSOCKET_PROTOCOL + HOST_AND_PORT);

    // Event listener for WebSocket open event
    newSocket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setSocket(newSocket);
    });

    // Event listener for WebSocket close event
    newSocket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setSocket(null);
    });

    newSocket.addEventListener('message', (event) => {
        const receivedMessage = event.data;
        console.log("receivedMessage=", receivedMessage);
        const messageJson = JSON.parse(receivedMessage);
        // add unique id
        messageJson.id = messages.length + 1;
        console.log("messageJson=", messageJson);
        setMessages([...messages, messageJson]);
    });
  

    // Clean up the WebSocket connection on component unmount
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
        try {
            const response = await axios.get(PROTOCOL + HOST_AND_PORT + '/messages', {
                mode: 'cors',
            });
            const messages = response.data;
            // change id to locally unique id (we don't want to use database ids in here)
            var count = 0;
            messages.map(message => message.id = count++);
            setMessages(messages);
        } catch (error) {
            console.error('Error retrieving messages:', error);
        }
    };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
 
  const handleSubmitName = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(PROTOCOL + HOST_AND_PORT + '/name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        // Request succeeded, handle the response here
        console.log('Name sent successfully!');
        setNameok(true);
      } else {
        // Request failed, handle the error here
        console.error('Failed to send name.');
      }
    } catch (error) {
      // Request error, handle the error here
      console.error('An error occurred:', error);
    }
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmitName(event);
    }
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  const handleSendMessage = () => {
    handleSetState();
    const message = document.getElementById('messageInput').value;
    const postMessage = { text: message, name: name };
    axios
      .post(PROTOCOL + HOST_AND_PORT + '/messages', postMessage)
      .then((response) => {
        handleSendSocketMessage(postMessage);
      })
      .catch((error) => {
        console.error('Error posting message:', error);
      });
    // Clear the input field after submitting the message
    document.getElementById('messageInput').value = '';
  };

  const handleSendSocketMessage = (message) => {
    if (socket && message) {
      const messageText = JSON.stringify(message);
      socket.send(messageText);
    }
  };
  
  const handleSetState = () => {
    if (inputValue.trim() !== '') {
      const newMessage = {
        id: messages.length + 1,
        name: name,
        text: inputValue,
      };

      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmitName}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
          />
        </label>
      </form>
      {nameok && (
        <div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className="message">
                {message.name + ' '}
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              id="messageInput"
              value={inputValue}
              onChange={handleInputChange}      
              onKeyDown={handleMessageKeyDown}
              placeholder="Type your message..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
