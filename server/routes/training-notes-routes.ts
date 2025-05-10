import express, { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  trainingModules, 
  userTrainingNotes,
  insertUserTrainingNoteSchema
} from '../../shared/schema';
import { z } from 'zod';

export function setupTrainingNotesRoutes(router: express.Router) {
  // Get all notes for a user
  router.get('/training/notes', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      
      const notes = await db.select()
        .from(userTrainingNotes)
        .leftJoin(
          trainingModules, 
          eq(userTrainingNotes.moduleId, trainingModules.id)
        )
        .where(eq(userTrainingNotes.userId, userId))
        .orderBy(desc(userTrainingNotes.createdAt));
      
      const formattedNotes = notes.map(note => ({
        id: note.user_training_notes.id,
        title: note.user_training_notes.title,
        content: note.user_training_notes.content,
        moduleId: note.user_training_notes.moduleId,
        moduleName: note.training_modules?.title || 'Unknown Module',
        moduleType: note.training_modules?.moduleType || 'custom',
        tags: note.user_training_notes.tags || [],
        isPrivate: note.user_training_notes.isPrivate,
        keyInsights: note.user_training_notes.keyInsights || [],
        createdAt: note.user_training_notes.createdAt,
        updatedAt: note.user_training_notes.updatedAt
      }));
      
      res.json(formattedNotes);
    } catch (error) {
      console.error('Error fetching training notes:', error);
      res.status(500).json({ error: 'Failed to fetch training notes' });
    }
  });
  
  // Get notes for a specific module
  router.get('/training/notes/module/:moduleId', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      const moduleId = parseInt(req.params.moduleId);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: 'Invalid module ID' });
      }
      
      const notes = await db.select()
        .from(userTrainingNotes)
        .where(
          and(
            eq(userTrainingNotes.userId, userId),
            eq(userTrainingNotes.moduleId, moduleId)
          )
        )
        .orderBy(desc(userTrainingNotes.createdAt));
      
      res.json(notes);
    } catch (error) {
      console.error('Error fetching module notes:', error);
      res.status(500).json({ error: 'Failed to fetch module notes' });
    }
  });
  
  // Create a new training note
  router.post('/training/notes', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      
      // Validate the request body
      const validatedData = insertUserTrainingNoteSchema.parse({
        ...req.body,
        userId
      });
      
      const newNote = await db.insert(userTrainingNotes)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newNote[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid note data', details: error.errors });
      }
      console.error('Error creating training note:', error);
      res.status(500).json({ error: 'Failed to create training note' });
    }
  });
  
  // Update an existing note
  router.patch('/training/notes/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      const noteId = parseInt(req.params.id);
      
      if (isNaN(noteId)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      // First check if note belongs to the user
      const existingNote = await db.select()
        .from(userTrainingNotes)
        .where(
          and(
            eq(userTrainingNotes.id, noteId),
            eq(userTrainingNotes.userId, userId)
          )
        )
        .limit(1);
      
      if (existingNote.length === 0) {
        return res.status(404).json({ error: 'Note not found or access denied' });
      }
      
      // Update the note
      const updatedNote = await db.update(userTrainingNotes)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(userTrainingNotes.id, noteId))
        .returning();
      
      res.json(updatedNote[0]);
    } catch (error) {
      console.error('Error updating training note:', error);
      res.status(500).json({ error: 'Failed to update training note' });
    }
  });
  
  // Delete a note
  router.delete('/training/notes/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      const noteId = parseInt(req.params.id);
      
      if (isNaN(noteId)) {
        return res.status(400).json({ error: 'Invalid note ID' });
      }
      
      // First check if note belongs to the user
      const existingNote = await db.select()
        .from(userTrainingNotes)
        .where(
          and(
            eq(userTrainingNotes.id, noteId),
            eq(userTrainingNotes.userId, userId)
          )
        )
        .limit(1);
      
      if (existingNote.length === 0) {
        return res.status(404).json({ error: 'Note not found or access denied' });
      }
      
      // Delete the note
      await db.delete(userTrainingNotes)
        .where(eq(userTrainingNotes.id, noteId));
      
      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting training note:', error);
      res.status(500).json({ error: 'Failed to delete training note' });
    }
  });
  
  // Get shared notes for a team (for admins/managers)
  router.get('/training/notes/shared', async (req: Request, res: Response) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = req.session.user.role;
      
      // Only managers or admins can see shared notes
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'doctor') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      const sharedNotes = await db.select({
        id: userTrainingNotes.id,
        title: userTrainingNotes.title,
        content: userTrainingNotes.content,
        moduleId: userTrainingNotes.moduleId,
        userId: userTrainingNotes.userId,
        tags: userTrainingNotes.tags,
        keyInsights: userTrainingNotes.keyInsights,
        createdAt: userTrainingNotes.createdAt
      })
        .from(userTrainingNotes)
        .leftJoin(
          trainingModules, 
          eq(userTrainingNotes.moduleId, trainingModules.id)
        )
        .where(eq(userTrainingNotes.isPrivate, false))
        .orderBy(desc(userTrainingNotes.createdAt));
      
      res.json(sharedNotes);
    } catch (error) {
      console.error('Error fetching shared notes:', error);
      res.status(500).json({ error: 'Failed to fetch shared notes' });
    }
  });
}