import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop'; // Add this
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { TopologyComponent } from './components/topology/topology.component';
import { DeviceComponent } from './components/device/device.component';
import { DeviceGroupComponent } from './components/device-group/device-group.component';
import { InterfaceComponent } from './components/interface/interface.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    TopologyComponent,
    DeviceComponent,
    DeviceGroupComponent,
    InterfaceComponent,
    SidebarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    FontAwesomeModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
