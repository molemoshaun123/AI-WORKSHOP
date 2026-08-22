# The OSI Model & Networking Basics

The OSI (Open Systems Interconnection) model is a conceptual framework used to understand and describe how different network protocols interact and work together to provide network services.

Here is a breakdown of the 7 layers based on my studies:

## 1. Physical Layer (Layer 1)
- **Function:** Deals with the physical transmission of raw data over a communication channel.
- **Components:** Cables like Cat6, physical hardware, voltages, radio frequencies.

## 2. Data Link Layer (Layer 2)
- **Function:** Responsible for node-to-node data transfer and error detection.
- **Components:** MAC Addresses, Switches. It frames the data for the physical layer.

## 3. Network Layer (Layer 3)
- **Function:** Handles the routing of data between different networks.
- **Components:** IP Addresses, Routers. This layer decides the best physical path for the data.

## 4. Transport Layer (Layer 4)
- **Function:** Ensures reliable data transfer and flow control.
- **Protocols:** 
  - **TCP (Transmission Control Protocol):** Reliable, connection-oriented, uses the 3-way handshake.
  - **UDP (User Datagram Protocol):** Fast, connectionless, unreliable (fire and forget).

## 5. Session Layer (Layer 5)
- **Function:** Establishes, manages, and terminates sessions between applications.
- **Components:** Session management, ensuring connections are kept alive as long as needed.

## 6. Presentation Layer (Layer 6)
- **Function:** Formats and encrypts data to be sent across a network.
- **Components:** Encryption, data compression, translation (making sure the receiving system can understand the data format).

## 7. Application Layer (Layer 7)
- **Function:** The layer that interacts directly with software applications.
- **Protocols:** HTTP, HTTPS, FTP, DNS.
