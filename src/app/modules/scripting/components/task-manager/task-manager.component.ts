import { Component, OnInit } from '@angular/core';

import { FadeInOut } from '@app/shared/animations';

@Component({
  selector: 'scripting-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss'],
  animations: [FadeInOut],
})
export class TaskManagerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    
  }

}
