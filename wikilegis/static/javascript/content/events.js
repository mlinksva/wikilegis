/* global prefixURL strings */
import { paths } from './config';
import { updatePath, updateHash } from './utils/history';
import { dismissAlert, showAlert } from './utils/alert';
import collapsibleModule from './modules/collapsible';
import drawerModule from './modules/drawer';
import hoverModule from './modules/hover';
import tabsModule from './modules/tabs';
import formsModule from './modules/forms';
import votesModule from './modules/votes';
import previewModule from './modules/preview';
import amendmentDiffModule from './modules/amendmentDiff';

const collapsible = collapsibleModule();
const drawer = drawerModule();
const hover = hoverModule();
const tabs = tabsModule();
const forms = formsModule();
const votes = votesModule();
const preview = previewModule();
const diff = amendmentDiffModule();

function clickEvent(event) {
  const dataset = event.target.dataset;
  const parent = event.target.closest('[data-drawer-open], [data-vote-action]');
  let parentDataset = null;
  if (parent) {
    parentDataset = parent.dataset;
  }

  if (dataset.drawerOpen) {
    drawer.open(event.target);
  } else if (parentDataset && parentDataset.drawerOpen) {
    drawer.open(parent);
  } else if (dataset.drawerClose) {
    drawer.close(dataset.drawerClose);
    forms.toggle(false);
  }

  if (dataset.formClose) {
    forms.toggle(false);
  }

  if (dataset.voteAction) {
    votes.sendVote(event.target);
  } else if (parentDataset && parentDataset.voteAction) {
    votes.sendVote(parent);
  }

  if (dataset.tab) {
    if (dataset.drawerOpen) {
      updatePath(event.target.href);
    } else {
      updateHash(event.target.href, event.target.hash);
      forms.toggle(false);
    }
    const navItemEl = document.querySelector(`.nav__item[data-tab][href="${window.location.hash}"]`);
    tabs.setActive(navItemEl);
  }

  if (dataset.collapsible) {
    collapsible.toggle(event.target);
  }
  if (dataset.dismissAlert) {
    dismissAlert();
  }

  if (dataset.notAuthenticated) {
    showAlert(strings.userNotLoggedInTitle, strings.userNotLoggedInText, 'error'); //
  } else if (dataset.formOpen) {
    forms.toggle(dataset.formOpen);
  }
}

function keyUpEvent(event) {
  const dataset = event.target.dataset;

  if (dataset.additiveAmendmentInput) {
    preview.additiveAmendmentPreview(event.target);
  }

  if (dataset.modifierAmendmentInput) {
    diff.updateDiff(event.target);
  }

  if (dataset.segmentsSearch) {
    forms.segmentSearch(event.target);
  }
}

function mouseoverEvent(event) {
  if (event.target.dataset.hover === 'segment-add') {
    hover.showSegmentAdd(event.target);
  }
}

function mouseoutEvent(event) {
  if (event.target.dataset.hover === 'segment-add') {
    hover.hideSegmentAdd(event.target);
  }
}

function submitEvent(event) {
  const dataset = event.target.dataset;
  if (!dataset.defaultBehavior) {
    event.preventDefault();

    if (dataset.commentsForm) {
      forms.sendComment(event.target);
    }

    if (dataset.amendmentsForm) {
      forms.sendAmendment(event.target);
    }

    if (dataset.subscribeForm) {
      forms.sendSubscribe(event.target);
    }
  }
}

function focusEvent(event) {
  const dataset = event.target.dataset;

  if (dataset.modifierAmendmentInput) {
    forms.loadSegmentText(event.target);
  }
}


function changeEvent(event) {
  const dataset = event.target.dataset;

  if (dataset.additiveAmendmentSelect) {
    preview.additiveAmendmentPreview(event.target.nextElementSibling);
  }
}

function changeContent(pathsDiff, action) {
  const pathsDiffArray = pathsDiff.split('/').filter(value => value.trim() !== '');

  for (let i = 0; i < pathsDiffArray.length; i += 2) {
    const contentName = pathsDiffArray[i];
    const contentId = pathsDiffArray[i + 1];

    if (action === 'open') drawer.open(contentName, contentId, false);
    else if (action === 'close') drawer.close(contentName, false);
  }
}

function historyChangeEvent() {
  paths.update(window.location.pathname);

  const pathsLast = paths.last;
  const pathsCurrent = paths.current;
  let pathsDiff = '';

  if (pathsCurrent === '/') {
    pathsDiff = pathsLast;
    changeContent(pathsDiff, 'close');
  } else if (pathsLast === '/') {
    pathsDiff = pathsCurrent;
    changeContent(pathsDiff, 'open');
  } else if (pathsCurrent > pathsLast) {
    pathsDiff = pathsCurrent.replace(pathsLast, '');
    changeContent(pathsDiff, 'open');
  } else if (pathsCurrent < pathsLast) {
    pathsDiff = pathsLast.replace(pathsCurrent, '');
    changeContent(pathsDiff, 'close');
  }
}

function windowLoadEvent() {
  const hash = window.location.hash;
  let path = window.location.pathname;
  if (prefixURL !== '') {
    path = path.replace(prefixURL, '');
  }
  changeContent(path, 'open');

  // specific to tab
  if (hash.indexOf('tab_') > -1) {
    const navItemEl = document.querySelector(`.nav__item[data-tab][href="${hash}"]`);
    tabs.setActive(navItemEl);
  }
}

document.addEventListener('click', clickEvent);
document.addEventListener('mouseover', mouseoverEvent);
document.addEventListener('mouseout', mouseoutEvent);
document.addEventListener('submit', submitEvent);
document.addEventListener('keyup', keyUpEvent);
document.addEventListener('focus', focusEvent, true);
document.addEventListener('change', changeEvent);

window.onpopstate = historyChangeEvent;
window.onload = windowLoadEvent;
