import HookController from './hook';
import Scheduler from './scheduler';
import VdomController from './vdom';

// Vdom controller has all hooks

const scheduler = new Scheduler();
const hookController = new HookController();
const vdom = new VdomController(scheduler, hookController);

const createElement = vdom.createElement;
const render = vdom.render;
const reRender = vdom.reRender;

const renderToString = vdom.renderToString;

const useState = hookController.useState;
const useEffect = hookController.useEffect;
const useStore = hookController.useStore;

export { createElement, render, renderToString, reRender, useState, useEffect, useStore };