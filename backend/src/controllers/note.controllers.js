import { asyncHandler } from "../utils/async.handler.js";
import { Note } from "../models/note.models.js";
import { ApiError } from "../utils/api-error.js";
import { Project } from "./../models/project.models.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/api-response.js";
import {UserRolesEnum} from "../utils/constants.js"

const getNotes = asyncHandler(async (req, res) => {
  // get all notes of a project
  const { projectId } = req.params;
  try {
    if (!projectId) {
      throw new ApiError(400, "Give a valid project");
    }
    const project = await Project.findById({
      _id:new mongoose.Types.ObjectId(projectId),
    });
    if (!project) {
      throw new ApiError(400, "Project not found");
    }
    const notes = await Note.find({
      project:new mongoose.Types.ObjectId(projectId),
    }).populate("createdBy", "username fullname avatar");

    if (!notes) {
      throw new ApiError(400, "Notes not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, notes, "notes fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const getNoteById = asyncHandler(async (req, res) => {
  // get note by id
  const { noteId } = req.params;
  try {
    if (!noteId) {
      throw new ApiError(500, "Provide noteId");
    }
    const singleNote = await Note.findOne({_id:noteId}).populate(
      "createdBy",
      "username fullname avatar",
    );
    if (!singleNote) {
      throw new ApiError(500, "Provide a valid noteId");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, singleNote, "note fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const createNote = asyncHandler(async (req, res) => {
  // create note
  const { projectId } = req.params;
  const { content } = req.body;
  try {
    if (!projectId) {
      throw new ApiError(400, "Provide a valid projectId");
    }
    if (!content) {
      throw new ApiError(400, "Note content is missing");
    }
    const project = await Project.findById({
      _id:new mongoose.Types.ObjectId(projectId),
    });
    if (!project) {
      throw new ApiError(400, "project not found");
    }
    const createNote = await Note.create({
      project: projectId,
      createdBy: req.user._id,
      content,
    });
    if (!createNote) {
      throw new ApiError(400, "note not created");
    }
    const noteInfo = await Note.findById(createNote._id).populate(
      "createdBy",
      "username fullname avatar",
    );
    return res
      .status(200)
      .json(new ApiResponse(200, noteInfo, "note created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const updateNote = asyncHandler(async (req, res) => {
  // update note
  const { noteId } = req.params;
  const { content } = req.body;
  try {
    if (!noteId) {
      throw new ApiError(400, "NoteId not found");
    }
    if (!content) {
      throw new ApiError(400, "Content not found");
    }
    const UpadtedNote = await Note.findByIdAndUpdate(
      noteId,
      { content },
      { new: true },
    ).populate("createdBy", "username fullname avatar");
    if (!UpadtedNote) {
      throw new ApiError(400, "Invalid noteId");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, UpadtedNote, "note updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

const deleteNote = asyncHandler(async (req, res) => {
  // delete note
  const { noteId } = req.params;
  try {
    if (!noteId) {
      throw new ApiError(400, "NoteId not found");
    }
    if(![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(req.user.role)){
      throw new ApiError(403, "you don't have permission to procced");
    }
    const note = await Note.findOneAndDelete({_id:noteId});
    if (!note) {
      throw new ApiError(400, "Note not found or already deleted");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "note deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Internal server error");
  }
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
