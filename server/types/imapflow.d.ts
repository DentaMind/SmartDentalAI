declare module 'imapflow' {
  export interface ImapFlowOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
    logger?: boolean | any;
    disableAutoIdle?: boolean;
    emitLogs?: boolean;
  }

  export interface FetchOptions {
    uid?: boolean;
    envelope?: boolean;
    bodyStructure?: boolean;
    source?: boolean;
    headers?: boolean | string[];
    bodyParts?: string[];
    flags?: boolean;
    date?: boolean;
    size?: boolean;
    attachments?: boolean;
    labels?: boolean;
    markSeen?: boolean;
    session?: any;
  }

  export interface MessageObject {
    uid: number;
    flags: string[];
    envelope: {
      date: Date;
      subject: string;
      from: Array<{
        name: string;
        address: string;
      }>;
      to: Array<{
        name: string;
        address: string;
      }>;
      cc?: Array<{
        name: string;
        address: string;
      }>;
      bcc?: Array<{
        name: string;
        address: string;
      }>;
      replyTo?: Array<{
        name: string;
        address: string;
      }>;
    };
    bodyStructure: any;
    size: number;
    source?: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      id: string;
      filename: string;
      contentType: string;
      disposition: string;
      size: number;
      content?: Buffer;
    }>;
  }

  export interface MailboxObject {
    path: string;
    delimiter: string;
    flags: string[];
    specialUse: string | null;
    listed: boolean;
    subscribed: boolean;
    exists: number;
  }

  export interface StatusObject {
    messages: number;
    unseen: number;
    uidNext: number;
    uidValidity: number;
  }

  export class ImapFlow {
    constructor(options: ImapFlowOptions);

    connect(): Promise<void>;
    logout(): Promise<void>;
    mailboxOpen(path: string): Promise<MailboxObject>;
    mailboxClose(): Promise<void>;
    mailboxList(options?: { onlySubscribed?: boolean; specialUse?: boolean }): AsyncIterableIterator<MailboxObject>;
    status(path: string, query?: string[]): Promise<StatusObject>;
    search(query: any, options?: { uid?: boolean }): Promise<number[]>;
    fetchOne(seq: number, options: FetchOptions): Promise<MessageObject>;
    fetch(range: string, options: FetchOptions): AsyncIterableIterator<MessageObject>;
    download(seq: number, part: string, options?: { uid?: boolean }): Promise<Buffer>;
    append(path: string, message: string | Buffer, options?: { flags?: string[]; date?: Date }): Promise<{ uidValidity: number; uid: number }>;
    delete(seq: number | number[], options?: { uid?: boolean }): Promise<void>;
    copy(seq: number | number[], destination: string, options?: { uid?: boolean }): Promise<void>;
    move(seq: number | number[], destination: string, options?: { uid?: boolean }): Promise<void>;
  }
}