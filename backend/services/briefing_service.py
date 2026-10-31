"""Executive briefing composition from canonical stored values; prose is not a forecast."""
class BriefingEngine:
    @staticmethod
    def package(decision,scenario,predictions,assumptions,notes=''):
        return {'decision_id':decision['id'],'scenario_id':scenario['id'],'title':decision['title'],'objective':decision['objective'],'predictions':predictions,'assumptions':assumptions,'human_notes':notes,'version':int(decision.get('briefing_version',0))+1,'evidence_labels':{'observed':'Source data','modeled':'Model output with bounds','judgment':'Human decision'},'warning':'Do not present illustrative or modeled values as observed facts.'}
